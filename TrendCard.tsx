"use client";

import { useMemo } from "react";
import { ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Card, CardTitle } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { evaluateHumidity, evaluateTemperature } from "@/lib/utils/thresholds";
import { formatHourMinute, worst } from "@/lib/utils/dashboard";
import type { DayRow } from "@/lib/supabase/queries";
import type { SensorDataRow } from "@/lib/supabase/types";

const HOUR = 3600_000;
const BUCKET = 10 * 60_000;
const TEMP = "#f9b872";
const HUM = "#4fd1c5";

interface Pt { t: number; temp?: number; hum?: number }

function bucketise(rows: DayRow[]): Pt[] {
  const m = new Map<number, { t: number[]; h: number[] }>();
  for (const r of rows) {
    if (r.temperature === null && r.humidity === null) continue;
    const k = Math.floor(new Date(r.created_at).getTime() / BUCKET) * BUCKET + BUCKET / 2;
    const b = m.get(k) ?? { t: [], h: [] };
    if (r.temperature !== null) b.t.push(r.temperature);
    if (r.humidity !== null) b.h.push(r.humidity);
    m.set(k, b);
  }
  const avg = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : undefined);
  return [...m.entries()].sort((a, b) => a[0] - b[0]).map(([t, b]) => ({ t, temp: avg(b.t), hum: avg(b.h) }));
}

function domain(vals: number[]): [number, number] {
  if (!vals.length) return [0, 1];
  const lo = Math.min(...vals), hi = Math.max(...vals);
  const pad = Math.max((hi - lo) * 0.45, 1);
  return [lo - pad, hi + pad];
}

export function TrendCard({ rows, envRow }: { rows: DayRow[]; envRow: SensorDataRow | null }) {
  const end = Date.now();
  const start = end - 24 * HOUR;
  const data = useMemo(() => bucketise(rows), [rows]);
  const tDom = domain(data.map((d) => d.temp).filter((v): v is number => v !== undefined));
  const hDom = domain(data.map((d) => d.hum).filter((v): v is number => v !== undefined));
  const first = Math.ceil(start / HOUR) * HOUR;
  const ticks = [first, first + 6 * HOUR, first + 12 * HOUR, first + 18 * HOUR, end];

  const temp = envRow?.temperature ?? null;
  const hum = envRow?.humidity ?? null;
  const sev = worst(evaluateTemperature(temp).severity, evaluateHumidity(hum).severity);

  return (
    <Card className="flex h-full flex-col">
      <div className="flex items-start justify-between">
        <CardTitle>Temperature &amp; humidity · last 24 hours</CardTitle>
        <Pill severity={sev} />
      </div>

      <div className="relative mt-3 min-h-[180px] flex-1">
        {data.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-[12.5px] text-[#7a8fa0]">
            Waiting for readings…
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="tempFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={TEMP} stopOpacity={0.38} />
                  <stop offset="100%" stopColor={TEMP} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#d5e0e6" strokeDasharray="3 5" />
              <XAxis
                dataKey="t" type="number" domain={[start, end]} ticks={ticks} allowDataOverflow
                tickFormatter={(v: number) => (v === ticks[4] ? "Now" : formatHourMinute(v))}
                axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#5b6f7e" }} tickMargin={10}
              />
              <YAxis yAxisId="t" hide domain={tDom} />
              <YAxis yAxisId="h" hide domain={hDom} />
              <Tooltip
                labelFormatter={(v: number) => formatHourMinute(v)}
                formatter={(v: number, name: string) => [name === "temp" ? `${v.toFixed(1)} °C` : `${v.toFixed(0)}%`, name === "temp" ? "Temperature" : "Humidity"]}
                contentStyle={{ borderRadius: 12, border: "1px solid #e1ebf0", fontSize: 12, boxShadow: "0 8px 24px -12px rgba(20,60,80,.25)" }}
              />
              <Area yAxisId="t" dataKey="temp" type="monotone" stroke={TEMP} strokeWidth={2.5} fill="url(#tempFill)" dot={false} connectNulls isAnimationActive={false} />
              <Line yAxisId="h" dataKey="hum" type="monotone" stroke={HUM} strokeWidth={2.5} dot={false} connectNulls isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-3 flex items-center gap-6 text-[12px] text-[#3d5363]">
        <span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: TEMP }} />Temperature {temp === null ? "—" : `${temp.toFixed(1)} °C`}</span>
        <span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: HUM }} />Humidity {hum === null ? "—" : `${hum.toFixed(0)}%`}</span>
      </div>
    </Card>
  );
}
