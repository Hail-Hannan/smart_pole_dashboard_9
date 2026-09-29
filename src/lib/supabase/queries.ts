import { getSupabaseClient } from "./client";
import {
  CombinedReading,
  SensorDataRow,
  isEnvironmentalRow,
  isWeatherRow,
} from "./types";

const TABLE = "sensor_data";

/**
 * Fetch the latest row that looks like an ESP32-A (environmental) reading
 * and the latest row that looks like an ESP32-B (weather) reading, then
 * combine them at the application layer. We deliberately do NOT join on
 * reading_slot, because ESP32-A currently never sets it (see types.ts).
 *
 * If a future firmware update makes both boards write reading_slot, both
 * rows will naturally share the same reading_slot and isTrulyCombined
 * will reflect that.
 */
export async function fetchCombinedLatestReading(): Promise<CombinedReading> {
  const supabase = getSupabaseClient();

  const [envResult, weatherResult] = await Promise.all([
    supabase
      .from(TABLE)
      .select("*")
      .not("temperature", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from(TABLE)
      .select("*")
      .not("pressure", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (envResult.error) throw envResult.error;
  if (weatherResult.error) throw weatherResult.error;

  const envRow = envResult.data ?? null;
  const weatherRow = weatherResult.data ?? null;

  const isTrulyCombined = Boolean(
    envRow &&
      weatherRow &&
      envRow.reading_slot !== null &&
      envRow.reading_slot === weatherRow.reading_slot
  );

  const timestamps = [envRow?.created_at, weatherRow?.created_at].filter(
    Boolean
  ) as string[];
  const latestTimestamp =
    timestamps.length > 0
      ? timestamps.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]
      : null;

  return { envRow, weatherRow, isTrulyCombined, latestTimestamp };
}

/**
 * Fetch the N most recent rows for the "Latest Records" table. Since env
 * and weather data currently arrive as separate rows, we fetch a larger
 * raw window and merge same-timeframe env/weather rows on the client so
 * each table row represents "what the Smart Pole reported around time T"
 * rather than showing two sparse, mostly-null rows per entry.
 */
export async function fetchRecentRawRows(
  limit = 60
): Promise<SensorDataRow[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

export interface MergedRecord {
  timestamp: string;
  temperature: number | null;
  humidity: number | null;
  light_level: number | null;
  co_ppm: number | null;
  pressure: number | null;
  rain: boolean | null;
  wind_speed: number | null;
  wind_direction: number | null;
  lightning_warning: boolean | null;
  xweather_lightning_distance_km: number | null;
  system_status: string | null;
}

/**
 * Merge raw rows into time-bucketed combined records for display. Buckets
 * env and weather rows that fall within the same MERGE_WINDOW_MS of each
 * other into a single displayed record; otherwise shows them as separate
 * partial records. This never invents values — a field stays null if no
 * row in the bucket provided it.
 */
const MERGE_WINDOW_MS = 15_000;

export function mergeRowsForDisplay(rows: SensorDataRow[]): MergedRecord[] {
  const sorted = [...rows].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const merged: MergedRecord[] = [];
  const used = new Set<number>();

  for (let i = 0; i < sorted.length; i++) {
    if (used.has(sorted[i].id)) continue;
    const row = sorted[i];
    const rowIsEnv = isEnvironmentalRow(row);
    const rowIsWeather = isWeatherRow(row);
    const rowTime = new Date(row.created_at).getTime();

    let partner: SensorDataRow | null = null;
    for (let j = i + 1; j < sorted.length; j++) {
      if (used.has(sorted[j].id)) continue;
      const candidate = sorted[j];
      const candidateTime = new Date(candidate.created_at).getTime();
      if (Math.abs(rowTime - candidateTime) > MERGE_WINDOW_MS) break;

      const candidateIsEnv = isEnvironmentalRow(candidate);
      const candidateIsWeather = isWeatherRow(candidate);

      if (
        (rowIsEnv && !rowIsWeather && candidateIsWeather && !candidateIsEnv) ||
        (rowIsWeather && !rowIsEnv && candidateIsEnv && !candidateIsWeather)
      ) {
        partner = candidate;
        used.add(candidate.id);
        break;
      }
    }

    used.add(row.id);

    const envRow = rowIsEnv ? row : partner;
    const weatherRow = rowIsWeather ? row : partner;

    merged.push({
      timestamp: row.created_at,
      temperature: envRow?.temperature ?? null,
      humidity: envRow?.humidity ?? null,
      light_level: envRow?.light_level ?? null,
      co_ppm: envRow?.co_ppm ?? null,
      pressure: weatherRow?.pressure ?? null,
      rain: weatherRow?.rain ?? null,
      wind_speed: weatherRow?.wind_speed ?? null,
      wind_direction: weatherRow?.wind_direction ?? null,
      lightning_warning: weatherRow?.lightning_warning ?? null,
      xweather_lightning_distance_km: weatherRow?.xweather_lightning_distance_km ?? null,
      system_status: weatherRow?.system_status ?? row.status ?? null,
    });
  }

  return merged;
}

/**
 * Fetch historical points for a single numeric column over the last N
 * rows that actually contain a non-null value for that column. Handles
 * NULLs by excluding them rather than coercing to 0.
 */
export async function fetchHistoricalSeries(
  column:
    | "temperature"
    | "humidity"
    | "co_ppm"
    | "light_level"
    | "pressure"
    | "wind_speed",
  limit = 50
): Promise<{ timestamp: string; value: number }[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select(`created_at, ${column}`)
    .not(column, "is", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  const rows = (data ?? []) as unknown as Record<string, unknown>[];

  return rows
    .map((r) => ({
      timestamp: r.created_at as string,
      value: r[column] as number,
    }))
    .reverse();
}

export interface DayRow {
  created_at: string;
  temperature: number | null;
  humidity: number | null;
  pressure: number | null;
  wind_speed: number | null;
  rain: boolean | null;
}

/** All rows from the last `hours` hours (oldest first), only the columns the
 * dashboard's trend chart, gust, pressure-trend and rain-activity need. */
export async function fetchLastHours(hours = 24, limit = 3000): Promise<DayRow[]> {
  const supabase = getSupabaseClient();
  const since = new Date(Date.now() - hours * 3600_000).toISOString();
  const { data, error } = await supabase
    .from(TABLE)
    .select("created_at, temperature, humidity, pressure, wind_speed, rain")
    .gte("created_at", since)
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as DayRow[];
}
