import { ArrowUp } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { beaufort, msToKmh, windSeverity } from "@/lib/utils/dashboard";
import { windDirectionShort } from "@/lib/utils/wind";
import type { SensorDataRow } from "@/lib/supabase/types";
import type { DayRow } from "@/lib/supabase/queries";

/** Peak wind speed (m/s) over the last 30 minutes, from the 24 h rows. */
function recentGust(rows: DayRow[], current: number | null): number | null {
  const since = Date.now() - 30 * 60_000;
  const vals = rows
    .filter((r) => r.wind_speed !== null && new Date(r.created_at).getTime() >= since)
    .map((r) => r.wind_speed as number);
  if (current !== null) vals.push(current);
  return vals.length ? Math.max(...vals) : null;
}

export function WindCard({ weatherRow, rows }: { weatherRow: SensorDataRow | null; rows: DayRow[] }) {
  const speed = weatherRow?.wind_speed ?? null;
  const dir = weatherRow?.wind_direction ?? null;
  const hasDir = dir !== null && !Number.isNaN(dir);
  const gust = recentGust(rows, speed);
  const sev = windSeverity(speed);

  const S = 172, C = S / 2;
  const cardinals = [
    { l: "N", x: C, y: 17 }, { l: "E", x: S - 17, y: C },
    { l: "S", x: C, y: S - 17 }, { l: "W", x: 17, y: C },
  ];

  return (
    <Card className="flex h-full flex-col">
      <div className="flex items-start justify-between">
        <CardTitle>Wind direction &amp; speed</CardTitle>
        <Pill severity={sev} />
      </div>

      <div className="mt-3 flex flex-1 flex-wrap items-center gap-x-9 gap-y-4">
        <svg viewBox={`0 0 ${S} ${S}`} width={S} height={S} className="shrink-0" aria-label="Wind direction compass">
          <circle cx={C} cy={C} r={C - 2} fill="none" stroke="#b9cfd6" strokeWidth={1.5} />
          <circle cx={C} cy={C} r={C - 22} fill="none" stroke="#dbe7ec" strokeWidth={1} />
          <line x1={C} y1={24} x2={C} y2={S - 24} stroke="#e6eef2" strokeWidth={1} />
          <line x1={24} y1={C} x2={S - 24} y2={C} stroke="#e6eef2" strokeWidth={1} />
          <circle cx={C} cy={C} r={26} fill="#e2f6f2" stroke="#cdeee8" strokeWidth={1} />
          {cardinals.map((c) => (
            <text key={c.l} x={c.x} y={c.y} textAnchor="middle" dominantBaseline="middle" fontSize={10} fontWeight={600} fill="#3d5363">
              {c.l}
            </text>
          ))}
          {hasDir && (
            <g transform={`rotate(${dir} ${C} ${C})`}>
              <line x1={C} y1={C + 14} x2={C} y2={C - 16} stroke="#2dd4bf" strokeWidth={5} strokeLinecap="round" />
              <polyline points={`${C - 11},${C - 8} ${C},${C - 21} ${C + 11},${C - 8}`} fill="none" stroke="#2dd4bf" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
            </g>
          )}
        </svg>

        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-[50px] font-bold leading-none tracking-[-0.03em] text-[#12283a]">
              {speed === null ? "—" : msToKmh(speed).toFixed(1)}
            </span>
            <span className="text-[16px] text-[#7a8fa0]">km/h</span>
          </div>
          <div className="mt-2 text-[13px] text-[#4a6070]">
            {hasDir ? `${windDirectionShort(dir)} · ${dir.toFixed(0)}°` : "Direction unavailable"}
          </div>
          <dl className="mt-4 space-y-2.5 text-[13.5px] text-[#4a6070]">
            <div>Gust <b className="ml-1 font-semibold text-[#12283a]">{gust === null ? "—" : `${msToKmh(gust).toFixed(1)} km/h`}</b></div>
            <div>Condition <b className="ml-1 font-semibold text-[#12283a]">{beaufort(speed).name}</b></div>
          </dl>
        </div>
      </div>
    </Card>
  );
}
