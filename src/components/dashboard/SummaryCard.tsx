import { CalendarDays } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { TONE, freshnessText, formatHourMinute, msToKmh } from "@/lib/utils/dashboard";
import { isDataStale } from "@/lib/utils/format";
import { extreme, rowsSince, startOfTodayMs } from "@/lib/utils/stats";
import type { QueryStatus } from "@/hooks/useLatestReading";
import type { SensorDataRow } from "@/lib/supabase/types";
import type { DayRow } from "@/lib/supabase/queries";

function Row({ label, value, time }: { label: string; value: string; time?: string }) {
  const na = value === "N/A";
  return (
    <div className="flex items-center justify-between border-b border-[#e6edf6] py-[5px] text-[13px] last:border-b-0 [@media(max-height:820px)]:py-[2px] [@media(max-height:820px)]:text-[12px]">
      <span className="text-[#33465e]">{label}</span>
      <span className="flex items-center gap-5">
        <b className={na ? "text-[#8a9bb0]" : "text-[#0b2a5b]"}>{value}</b>
        <span className="w-10 text-right text-[12px] text-[#5d7088]">{time ?? "—"}</span>
      </span>
    </div>
  );
}

function StationHealth({
  queryStatus, envRow, weatherRow, latestTimestamp,
}: { queryStatus: QueryStatus; envRow: SensorDataRow | null; weatherRow: SensorDataRow | null; latestTimestamp: string | null }) {
  const envOk = envRow ? !isDataStale(envRow.created_at) : null;
  const wxOk = weatherRow ? !isDataStale(weatherRow.created_at) : null;
  const telemetry =
    !envRow && !weatherRow ? { v: "No data", ok: null as boolean | null }
    : envOk && wxOk ? { v: "Connected", ok: true }
    : { v: envOk || wxOk ? "Partial" : "Stale", ok: envOk || wxOk ? null : false };
  const gateway =
    queryStatus === "success" ? { v: "Online", ok: true as boolean | null }
    : queryStatus === "error" ? { v: "Offline", ok: false }
    : { v: "Connecting…", ok: null };
  const fresh = latestTimestamp ? !isDataStale(latestTimestamp) : null;

  const items = [
    { l: "Telemetry", v: telemetry.v, ok: telemetry.ok },
    { l: "Gateway", v: gateway.v, ok: gateway.ok },
    { l: "Updated", v: freshnessText(latestTimestamp), ok: fresh },
  ];
  return (
    <div className="mt-1 flex shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-0.5 border-t border-[#e6edf6] pt-1.5 text-[11.5px]">
      <b className="text-[#0b2a5b]">Station Health</b>
      {items.map((i) => {
        const t = i.ok === null ? TONE.warning : i.ok ? TONE.normal : TONE.danger;
        return (
          <span key={i.l} className="flex items-center gap-1.5 text-[#5d7088]">
            <i className="h-2 w-2 rounded-full" style={{ backgroundColor: t.dot }} />
            {i.l} <b style={{ color: t.text }}>{i.v}</b>
          </span>
        );
      })}
    </div>
  );
}

export function SummaryCard(props: {
  rows: DayRow[]; queryStatus: QueryStatus; envRow: SensorDataRow | null; weatherRow: SensorDataRow | null; latestTimestamp: string | null;
}) {
  // Include the latest rows too, so the summary never lags behind the live cards.
  const latest: DayRow[] = [props.envRow, props.weatherRow].flatMap((r) =>
    r ? [{ created_at: r.created_at, temperature: r.temperature, humidity: r.humidity, wind_speed: r.wind_speed, wind_direction: r.wind_direction, xweather_lightning: r.xweather_lightning, xweather_reading_type: r.xweather_reading_type, xweather_lightning_distance_km: r.xweather_lightning_distance_km }] : []
  );
  const today = rowsSince([...props.rows, ...latest], startOfTodayMs());
  const hasRows = today.length > 0;
  const hiTemp = extreme(today, (r) => r.temperature, "max");
  const gust = extreme(today, (r) => r.wind_speed, "max");
  const lightning = extreme(
    today,
    (r) =>
      r.xweather_reading_type !== "UNAVAILABLE" && r.xweather_lightning === true && r.xweather_lightning_distance_km !== null && r.xweather_lightning_distance_km >= 0
        ? r.xweather_lightning_distance_km
        : null,
    "min"
  );
  const t = (ms?: number) => (ms === undefined ? undefined : formatHourMinute(ms));

  return (
    <Card className="h-full">
      <h2 className="mb-0.5 flex shrink-0 items-center gap-2 text-[16px] font-bold text-[#0b2a5b]">
        <CalendarDays className="h-5 w-5" /> Today&apos;s Summary
      </h2>
      <div className="flex min-h-0 flex-1 flex-col justify-around">
        <Row label="Highest Temperature" value={hiTemp ? `${hiTemp.value.toFixed(1)} °C` : "N/A"} time={t(hiTemp?.at)} />
        <Row label="Strongest Wind Gust" value={gust ? `${msToKmh(gust.value).toFixed(0)} km/h` : "N/A"} time={t(gust?.at)} />
        <Row label="Closest Lightning" value={lightning ? `${lightning.value.toFixed(1)} km` : hasRows ? "None" : "N/A"} time={t(lightning?.at)} />
        <Row label="Highest Solar Radiation" value="N/A" />
        <Row label="Total Rainfall" value="N/A" />
      </div>
      <StationHealth {...props} />
    </Card>
  );
}
