import { Sun } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/Card";
import { STATION } from "@/lib/config";
import { TONE, agoLong, freshnessText, lightDescription } from "@/lib/utils/dashboard";
import { isDataStale } from "@/lib/utils/format";
import type { QueryStatus } from "@/hooks/useLatestReading";
import type { SensorDataRow } from "@/lib/supabase/types";
import type { DayRow } from "@/lib/supabase/queries";

export function RainActivityCard({ weatherRow, rows }: { weatherRow: SensorDataRow | null; rows: DayRow[] }) {
  const samples = rows.filter((r) => r.rain !== null);
  const wet = samples.filter((r) => r.rain === true).length;
  const pct = samples.length ? (wet / samples.length) * 100 : null;
  const rain = weatherRow?.rain ?? null;

  return (
    <Card className="flex h-full flex-col">
      <CardTitle>Rainfall activity</CardTitle>
      <div className="mt-4 flex items-center gap-5">
        <div className="flex shrink-0 items-baseline gap-1.5">
          <span className="text-[36px] font-bold leading-none tracking-[-0.03em] text-[#12283a]">{pct === null ? "—" : pct.toFixed(0)}</span>
          <span className="text-[15px] text-[#8397a6]">% wet</span>
        </div>
        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#e2ecf3]">
          <div className="h-full rounded-full bg-gradient-to-r from-[#3b9be0] to-[#5ed3e0] transition-[width] duration-700" style={{ width: `${pct ?? 0}%` }} />
        </div>
      </div>
      <p className="mt-auto pt-5 text-[12.5px] text-[#5b6f7e]">
        Last 24 h · {wet} of {samples.length} readings detected rain · current state: {rain === null ? "unknown" : rain ? "raining" : "no rain"}
      </p>
    </Card>
  );
}

export function LightConditionsCard({ envRow }: { envRow: SensorDataRow | null }) {
  const light = envRow?.light_level ?? null;
  return (
    <Card className="flex h-full flex-col">
      <CardTitle>Light conditions</CardTitle>
      <div className="mt-4 flex items-center gap-3">
        <span className="text-[36px] font-bold leading-none tracking-[-0.03em] text-[#12283a]">{light === null ? "—" : light.toLocaleString("en-US")}</span>
        <span className="text-[15px] text-[#8397a6]">{STATION.lightUnit}</span>
        <Sun size={26} strokeWidth={1.6} className="ml-1 text-[#f5b73b]" fill="#fcd34d" />
      </div>
      <p className="mt-auto pt-5 text-[12.5px] text-[#5b6f7e]">
        {lightDescription(light)} · last measurement {agoLong(envRow?.created_at ?? null)}
      </p>
    </Card>
  );
}

function HealthRow({ label, value, ok }: { label: string; value: string; ok: boolean | null }) {
  const t = ok === null ? TONE.warning : ok ? TONE.normal : TONE.danger;
  return (
    <div className="flex items-center justify-between border-b border-[#e6eef2] py-3 text-[13px] last:border-b-0 last:pb-0">
      <span className="text-[#4a6070]">{label}</span>
      <span className="flex items-center gap-2 text-[12px] font-bold" style={{ color: t.text }}>
        <i className="h-2 w-2 rounded-full" style={{ backgroundColor: t.dot }} />
        {value}
      </span>
    </div>
  );
}

export function StationHealthCard({
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
  const fresh = isDataStale(latestTimestamp) ? false : true;

  return (
    <Card className="flex h-full flex-col">
      <CardTitle>Station health</CardTitle>
      <div className="mt-3">
        <HealthRow label="Sensor telemetry" value={telemetry.v} ok={telemetry.ok} />
        <HealthRow label="Gateway connection" value={gateway.v} ok={gateway.ok} />
        <HealthRow label="Data freshness" value={freshnessText(latestTimestamp)} ok={latestTimestamp ? fresh : null} />
      </div>
    </Card>
  );
}
