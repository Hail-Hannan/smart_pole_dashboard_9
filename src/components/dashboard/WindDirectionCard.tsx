"use client";

import { useMemo } from "react";
import { Compass } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Card, CardHeader } from "@/components/ui/Card";
import { formatHourMinute } from "@/lib/utils/dashboard";
import { windDirectionName, windDirectionShort } from "@/lib/utils/wind";
import type { SensorDataRow } from "@/lib/supabase/types";
import type { DayRow } from "@/lib/supabase/queries";

const HOUR = 3600_000;
const BUCKET = 2 * 60_000;
const LABELS = [
  { l: "N", a: 0 }, { l: "NE", a: 45 }, { l: "E", a: 90 }, { l: "SE", a: 135 },
  { l: "S", a: 180 }, { l: "SW", a: 225 }, { l: "W", a: 270 }, { l: "NW", a: 315 },
];

export function WindDirectionCard({ weatherRow, rows }: { weatherRow: SensorDataRow | null; rows: DayRow[] }) {
  const dir = weatherRow?.wind_direction ?? null;
  const has = dir !== null && !Number.isNaN(dir);
  const end = Date.now();
  const start = end - HOUR;

  const data = useMemo(() => {
    const m = new Map<number, number>();
    for (const r of rows) {
      const t = new Date(r.created_at).getTime();
      if (r.wind_direction === null || t < Date.now() - HOUR) continue;
      m.set(Math.floor(t / BUCKET) * BUCKET + BUCKET / 2, r.wind_direction); // last sample in each bucket
    }
    return [...m.entries()].sort((a, b) => a[0] - b[0]).map(([t, v]) => ({ t, v }));
  }, [rows]);

  const ticks = [0, 1, 2, 3, 4].map((i) => start + (i * HOUR) / 4);
  const C = 100;
  const pos = (a: number, r: number): [number, number] => [C + r * Math.sin((a * Math.PI) / 180), C - r * Math.cos((a * Math.PI) / 180)];

  return (
    <Card className="h-full gap-1.5">
      <CardHeader icon={<Compass className="h-5 w-5 text-[#1d3a8a]" />} title="Wind Direction" />
      <div className="min-h-0 flex-[1.5]">
        <svg viewBox="0 0 200 200" className="h-full w-full" aria-label="Wind direction compass">
          <circle cx={C} cy={C} r={72} fill="#f7faff" stroke="#d5e0ee" strokeWidth={1.5} />
          <circle cx={C} cy={C} r={52} fill="none" stroke="#e3ebf5" />
          {Array.from({ length: 36 }, (_, i) => i * 10).map((a) => {
            const [x1, y1] = pos(a, 72);
            const [x2, y2] = pos(a, a % 90 === 0 ? 64 : 68);
            return <line key={a} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#9fb2c9" strokeWidth={a % 90 === 0 ? 1.5 : 0.8} />;
          })}
          {LABELS.map(({ l, a }) => {
            const [x, y] = pos(a, 88);
            const major = l.length === 1;
            return (
              <text key={l} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize={major ? 13 : 9.5} fontWeight={major ? 700 : 500} fill="#0b2a5b">{l}</text>
            );
          })}
          {has && (
            <g transform={`rotate(${dir} ${C} ${C})`}>
              <polygon points={`${C},${C - 74} ${C - 10},${C - 50} ${C + 10},${C - 50}`} fill="#1d6af5" />
            </g>
          )}
          <text x={C} y={C - 2} textAnchor="middle" fontSize={has ? 24 : 18} fontWeight={700} fill={has ? "#0b2a5b" : "#8a9bb0"}>{has ? `${dir.toFixed(0)}°` : "N/A"}</text>
          <text x={C} y={C + 17} textAnchor="middle" fontSize={11} fontWeight={600} fill="#33465e">{has ? windDirectionShort(dir) : ""}</text>
        </svg>
      </div>
      <div className="shrink-0 text-center text-[12px] text-[#33465e]">{has ? windDirectionName(dir) : "Direction unavailable"}</div>

      <div className="shrink-0 text-[12px] font-bold text-[#0b2a5b]">Direction Trend (Last 1 Hour)</div>
      <div className="relative min-h-0 flex-1">
        {data.length < 2 ? (
          <div className="absolute inset-0 flex items-center justify-center text-[11.5px] text-[#8a9bb0]">Waiting for readings…</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 4, right: 6, left: -14, bottom: 0 }}>
              <CartesianGrid stroke="#e3ebf5" />
              <XAxis dataKey="t" type="number" domain={[start, end]} ticks={ticks} allowDataOverflow tickFormatter={(v: number) => formatHourMinute(v)} tick={{ fontSize: 9, fill: "#475b73" }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 360]} ticks={[0, 90, 180, 270, 360]} tick={{ fontSize: 9, fill: "#475b73" }} axisLine={false} tickLine={false} />
              <Tooltip labelFormatter={(v: number) => formatHourMinute(v)} formatter={(v: number) => [`${v.toFixed(0)}°`, "Direction"]} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
              <Line dataKey="v" stroke="#1d6af5" strokeWidth={1.8} dot={{ r: 1.8, fill: "#1d6af5", strokeWidth: 0 }} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}
