import { STATION } from "@/lib/config";
import { Header } from "./Header";
import { WindCard } from "./WindCard";
import { TrendCard } from "./TrendCard";
import { LightningCard } from "./LightningCard";
import { KpiRow } from "./KpiRow";
import { RainActivityCard, LightConditionsCard, StationHealthCard } from "./BottomRow";
import type { QueryStatus } from "@/hooks/useLatestReading";
import type { SensorDataRow } from "@/lib/supabase/types";
import type { DayRow } from "@/lib/supabase/queries";

const LEGEND = [
  { t: "Normal", c: "#15803d", bg: "#dcf3e4", d: "#16a34a" },
  { t: "Caution", c: "#a45f06", bg: "#fdecc8", d: "#d97706" },
  { t: "Alert", c: "#b91c1c", bg: "#fbdada", d: "#dc2626" },
];

export function DashboardView(props: {
  envRow: SensorDataRow | null;
  weatherRow: SensorDataRow | null;
  rows: DayRow[];
  queryStatus: QueryStatus;
  latestTimestamp: string | null;
  updateSeconds: number;
  error?: string | null;
}) {
  const { envRow, weatherRow, rows, queryStatus, latestTimestamp, updateSeconds, error } = props;
  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-5 px-4 py-6 sm:px-6">
      <Header queryStatus={queryStatus} latestTimestamp={latestTimestamp} />

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[31px] font-bold leading-tight tracking-[-0.035em] text-[#12283a]">{STATION.title}</h1>
          <p className="mt-1.5 text-[13px] text-[#5b6f7e]">Real-time station overview · {STATION.location}</p>
        </div>
        <div className="flex flex-col gap-2.5 sm:items-end">
          <p className="text-[12.5px] text-[#5b6f7e]">LIVE DATA · Units: metric · Update interval: {updateSeconds} seconds</p>
          <div className="flex gap-2">
            {LEGEND.map((l) => (
              <span key={l.t} className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold" style={{ color: l.c, backgroundColor: l.bg }}>
                <i className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: l.d }} />{l.t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[12.5px] text-red-700">
          <b>Supabase query failed</b> — <span className="font-mono text-[11.5px]">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-12 xl:col-span-4"><WindCard weatherRow={weatherRow} rows={rows} /></div>
        <div className="lg:col-span-7 xl:col-span-5"><TrendCard rows={rows} envRow={envRow} /></div>
        <div className="lg:col-span-5 xl:col-span-3"><LightningCard weatherRow={weatherRow} /></div>
      </div>

      <KpiRow envRow={envRow} weatherRow={weatherRow} rows={rows} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <RainActivityCard weatherRow={weatherRow} rows={rows} />
        <LightConditionsCard envRow={envRow} />
        <StationHealthCard queryStatus={queryStatus} envRow={envRow} weatherRow={weatherRow} latestTimestamp={latestTimestamp} />
      </div>

      <footer className="flex flex-col gap-1 pt-1 text-[11px] text-[#6b7f8d] sm:flex-row sm:justify-between">
        <span>{STATION.footerLeft}</span>
        <span>{STATION.footerRight}</span>
      </footer>
    </div>
  );
}
