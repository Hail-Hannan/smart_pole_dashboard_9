import { getSupabaseClient } from "./client";
import {
  CombinedReading,
  SensorDataRow,
  isEnvironmentalRow,
  isWeatherRow,
} from "./types";

const TABLE = "sensor_data";

/**
 * Fetch the latest temperature/humidity row and the latest weather row
 * (wind + lightning), then combine them at the application layer. With the
 * single-ESP32 firmware both normally resolve to the same row.
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
      // Every current firmware row carries the Xweather fields, wind and
      // reading_slot. (Pressure is no longer sent, so it must not be used.)
      .not("xweather_reading_type", "is", null)
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
  wind_speed: number | null;
  wind_direction: number | null;
  xweather_lightning: boolean | null;
  xweather_reading_type: string | null;
  xweather_lightning_distance_km: number | null;
}

const DAY_COLUMNS =
  "created_at, temperature, humidity, wind_speed, wind_direction, xweather_lightning, xweather_reading_type, xweather_lightning_distance_km";
// Supabase/PostgREST returns at most 1000 rows per request, and the firmware
// writes one row per 15 s (~5760 / day), so the window is fetched in pages.
const PAGE_SIZE = 1000;

/** All rows from the last `hours` hours (oldest first). */
export async function fetchLastHours(hours = 24, maxRows = 8000): Promise<DayRow[]> {
  const supabase = getSupabaseClient();
  const since = new Date(Date.now() - hours * 3600_000).toISOString();
  const out: DayRow[] = [];
  for (let from = 0; from < maxRows; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from(TABLE)
      .select(DAY_COLUMNS)
      .gte("created_at", since)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    const page = (data ?? []) as DayRow[];
    out.push(...page);
    if (page.length < PAGE_SIZE) break;
  }
  return out;
}
