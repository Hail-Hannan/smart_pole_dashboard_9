import { Droplets, Thermometer } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Gauge } from "@/components/ui/Gauge";
import { Stat } from "@/components/ui/Stat";
import { feelsLike } from "@/lib/utils/dashboard";
import { evaluateTemperature } from "@/lib/utils/thresholds";
import { average, nums, rowsSince, startOfTodayMs } from "@/lib/utils/stats";
import type { SensorDataRow } from "@/lib/supabase/types";
import type { DayRow } from "@/lib/supabase/queries";

const SEGMENTS = [
  { from: 0, to: 30, color: "#22a559" },
  { from: 30, to: 35, color: "#f5a300" },
  { from: 35, to: 50, color: "#e5322d" },
];

const f1 = (v: number | null) => (v === null ? "N/A" : v.toFixed(1));

export function TemperatureCard({ envRow, rows }: { envRow: SensorDataRow | null; rows: DayRow[] }) {
  const temp = envRow?.temperature ?? null;
  const hum = envRow?.humidity ?? null;
  const feels = feelsLike(temp, hum);
  const ev = evaluateTemperature(temp);

  const today = nums(rowsSince(rows, startOfTodayMs()), (r) => r.temperature);
  if (temp !== null) today.push(temp);
  const min = today.length ? Math.min(...today) : null;
  const max = today.length ? Math.max(...today) : null;

  return (
    <Card className="min-h-0 flex-1 gap-1.5">
      <CardHeader
        icon={<Thermometer className="h-5 w-5 text-[#e11d1d]" />}
        iconBg="#fdecec"
        title="Temperature"
        badge={<Badge tone={ev.severity === "warning" ? "orange" : ev.severity} label={ev.label} />}
      />
      <div className="min-h-0 flex-1">
        <Gauge min={0} max={50} value={temp} segments={SEGMENTS} ticks={[0, 10, 20, 30, 40, 50]}>
          <text x={100} y={96} textAnchor="middle" fontSize={27} fontWeight={700} fill={temp === null ? "#8a9bb0" : "#0b2a5b"}>
            {temp === null ? "N/A" : `${temp.toFixed(1)}`}
            {temp !== null && <tspan fontSize={14} fontWeight={600}> °C</tspan>}
          </text>
          <text x={100} y={114} textAnchor="middle" fontSize={9.5} fill="#33465e">
            {feels === null ? "Feels like N/A" : `Feels like ${feels.toFixed(1)}°C`}
          </text>
        </Gauge>
      </div>
      <div className="flex shrink-0 items-center justify-center gap-1.5 text-[12px] text-[#33465e]">
        <Droplets className="h-4 w-4 text-[#1d6af5]" />
        Humidity <b className={hum === null ? "text-[#8a9bb0]" : "text-[#0b2a5b]"}>{hum === null ? "N/A" : `${hum.toFixed(1)} %`}</b>
      </div>
      <div className="grid shrink-0 grid-cols-3 gap-2">
        <Stat label="Min Today" value={f1(min)} unit="°C" />
        <Stat label="Average" value={f1(average(today))} unit="°C" />
        <Stat label="Max Today" value={f1(max)} unit="°C" />
      </div>
    </Card>
  );
}
