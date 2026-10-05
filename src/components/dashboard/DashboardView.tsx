import { Header } from "./Header";
import { Footer } from "./Footer";
import { LightningCard } from "./LightningCard";
import { WindCard } from "./WindCard";
import { WindDirectionCard } from "./WindDirectionCard";
import { TemperatureCard } from "./TemperatureCard";
import { SolarCard } from "./SolarCard";
import { TrendCard } from "./TrendCard";
import { SummaryCard } from "./SummaryCard";
import type { QueryStatus } from "@/hooks/useLatestReading";
import type { SensorDataRow } from "@/lib/supabase/types";
import type { DayRow } from "@/lib/supabase/queries";

export function DashboardView(props: {
  envRow: SensorDataRow | null;
  weatherRow: SensorDataRow | null;
  rows: DayRow[];
  queryStatus: QueryStatus;
  latestTimestamp: string | null;
  updateSeconds: number;
  error?: string | null;
}) {
  const { envRow, weatherRow, rows, queryStatus, latestTimestamp, error } = props;
  return (
    <div className="flex min-h-dvh flex-col xl:h-dvh xl:min-h-[680px] xl:overflow-hidden">
      <Header queryStatus={queryStatus} latestTimestamp={latestTimestamp} />

      <main className="flex min-h-0 flex-1 flex-col gap-3 px-4 py-2.5">
        {error && (
          <div className="shrink-0 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-[12.5px] text-red-700">
            <b>Supabase query failed</b> — <span className="font-mono text-[11.5px]">{error}</span>
          </div>
        )}

        <div className="grid min-h-0 flex-[1.85] grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[1.4fr_1.05fr_0.95fr_0.95fr]">
          <div className="min-h-[400px] xl:min-h-0"><LightningCard weatherRow={weatherRow} /></div>
          <div className="min-h-[400px] xl:min-h-0"><WindCard weatherRow={weatherRow} rows={rows} /></div>
          <div className="min-h-[400px] xl:min-h-0"><WindDirectionCard weatherRow={weatherRow} rows={rows} /></div>
          <div className="flex min-h-[400px] flex-col gap-3 xl:min-h-0">
            <TemperatureCard envRow={envRow} rows={rows} />
            <SolarCard />
          </div>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 xl:grid-cols-[3fr_1fr]">
          <div className="min-h-[240px] xl:min-h-0"><TrendCard rows={rows} /></div>
          <div className="min-h-[240px] xl:min-h-0">
            <SummaryCard rows={rows} queryStatus={queryStatus} envRow={envRow} weatherRow={weatherRow} latestTimestamp={latestTimestamp} />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
