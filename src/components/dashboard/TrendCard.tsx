"use client";

import { useMemo } from "react";
import { LineChart as LineIcon } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Card } from "@/components/ui/Card";
import { formatHourMinute, msToKmh } from "@/lib/utils/dashboard";
import type { DayRow } from "@/lib/supabase/queries";

const HOUR = 3600_000;
const BUCKET = 15 * 60_000;
const TEMP = "#ef2b3a";
const WIND = "#1d6af5";
const HUM = "#22a559";
const SOLAR = "#f5b800";

interface Pt { t: number; temp?: number; wind?: number; hum?: number }

function bucketise(rows: DayRow[]): Pt[] {
  const m = new Map<number, { t: number[]; w: number[]; h: number[] }>();
  for (const r of rows) {
    const k = Math.floor(new Date(r.created_at).getTime() / BUCKET) * BUCKET + BUCKET / 2;
    const b = m.get(k) ?? { t: [], w: [], h: [] };
    if (r.temperature !== null) b.t.push(r.temperature);
    if (r.wind_speed !== null) b.w.push(msToKmh(r.wind_speed));
    if (r.humidity !== null) b.h.push(r.humidity);
    m.set(k, b);
  }
  const avg = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : undefined);
  return [...m.entries()].sort((a, b) => a[0] - b[0]).map(([t, b]) => ({ t, temp: avg(b.t), wind: avg(b.w), hum: avg(b.h) }));
}

function LegendItem({ color, label, off }: { color: string; label: string; off?: boolean }) {
  return (
    <span className={`flex items-center gap-1.5 text-[12px] ${off ? "text-[#8a9bb0]" : "text-[#33465e]"}`}>
      <i className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: off ? "#c5d0de" : color }} />
      {label}
    </span>
  );
}

export function TrendCard({ rows }: { rows: DayRow[] }) {
  const end = Date.now();
  const start = end - 24 * HOUR;
  const data = useMemo(() => bucketise(rows), [rows]);
  const top = Math.max(100, Math.ceil(Math.max(0, ...data.map((d) => d.wind ?? 0)) / 20) * 20);
  const first = Math.ceil(start / (4 * HOUR)) * 4 * HOUR;
  const ticks = [0, 1, 2, 3, 4, 5].map((i) => first + i * 4 * HOUR).filter((t) => t <= end);

  return (
    <Card className="h-full gap-1">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <h2 className="flex items-center gap-2 text-[16px] font-bold text-[#0b2a5b]">
          <LineIcon className="h-5 w-5" /> Environmental Trends (Last 24 Hours)
        </h2>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <LegendItem color={TEMP} label="Temperature (°C)" />
          <LegendItem color={WIND} label="Wind Speed (km/h)" />
          <LegendItem color={SOLAR} label="Solar Radiation (W/m²) · N/A" off />
          <LegendItem color={HUM} label="Humidity (%)" />
        </div>
      </div>

      <div className="relative min-h-[120px] flex-1">
        {data.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-[12.5px] text-[#8a9bb0]">Waiting for readings…</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 6, right: 12, left: -18, bottom: 0 }}>
              <CartesianGrid stroke="#e3ebf5" />
              <XAxis dataKey="t" type="number" domain={[start, end]} ticks={ticks} allowDataOverflow tickFormatter={(v: number) => formatHourMinute(v)} tick={{ fontSize: 11, fill: "#475b73" }} axisLine={false} tickLine={false} tickMargin={6} />
              <YAxis domain={[0, top]} tick={{ fontSize: 11, fill: "#475b73" }} axisLine={false} tickLine={false} />
              <Tooltip
                labelFormatter={(v: number) => formatHourMinute(v)}
                formatter={(v: number, name: string) => [name === "temp" ? `${v.toFixed(1)} °C` : name === "wind" ? `${v.toFixed(1)} km/h` : `${v.toFixed(1)} %`, name === "temp" ? "Temperature" : name === "wind" ? "Wind speed" : "Humidity"]}
                contentStyle={{ borderRadius: 10, border: "1px solid #e1e9f3", fontSize: 12 }}
              />
              <Line dataKey="temp" type="monotone" stroke={TEMP} strokeWidth={2} dot={false} connectNulls isAnimationActive={false} />
              <Line dataKey="wind" type="monotone" stroke={WIND} strokeWidth={2} dot={false} connectNulls isAnimationActive={false} />
              <Line dataKey="hum" type="monotone" stroke={HUM} strokeWidth={2} dot={false} connectNulls isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}
