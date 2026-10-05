import { Wind } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Gauge } from "@/components/ui/Gauge";
import { Notice } from "@/components/ui/Notice";
import { Stat } from "@/components/ui/Stat";
import { beaufort, msToKmh, windSeverity, uiLabel } from "@/lib/utils/dashboard";
import { average, extreme, nums, rowsSince, startOfTodayMs } from "@/lib/utils/stats";
import type { SensorDataRow } from "@/lib/supabase/types";
import type { DayRow } from "@/lib/supabase/queries";

const SEGMENTS = [
  { from: 0, to: 39, color: "#22a559" },
  { from: 39, to: 62, color: "#f7b500" },
  { from: 62, to: 120, color: "#e5322d" },
];

const fmt = (ms: number | null) => (ms === null ? "N/A" : msToKmh(ms).toFixed(0));

export function WindCard({ weatherRow, rows }: { weatherRow: SensorDataRow | null; rows: DayRow[] }) {
  const speed = weatherRow?.wind_speed ?? null;
  const kmh = speed === null ? null : msToKmh(speed);
  const sev = windSeverity(speed);
  const now = Date.now();

  const withNow = (list: number[]) => (speed === null ? list : [...list, speed]);
  const last30 = withNow(nums(rowsSince(rows, now - 30 * 60_000), (r) => r.wind_speed));
  const lastHour = withNow(nums(rowsSince(rows, now - 3600_000), (r) => r.wind_speed));
  const gust = last30.length ? Math.max(...last30) : null;
  const avg = average(lastHour);
  const todayMax = extreme(rowsSince(rows, startOfTodayMs(now)), (r) => r.wind_speed, "max")?.value ?? null;
  const maxToday = todayMax === null ? speed : speed !== null ? Math.max(todayMax, speed) : todayMax;

  const tone: BadgeTone = sev === "warning" ? "warning" : sev;
  const notice: { tone: BadgeTone; title: string; body: string } =
    sev === "unknown" ? { tone: "unknown", title: "Wind data unavailable", body: "No wind reading received yet." }
    : sev === "normal" ? { tone: "normal", title: `${beaufort(speed).name}`, body: "Wind conditions are within normal limits." }
    : sev === "warning" ? { tone: "warning", title: "Strong wind conditions", body: "Secure loose objects." }
    : { tone: "danger", title: "Gale-force wind conditions", body: "Avoid exposed work and secure equipment." };

  return (
    <Card className="h-full gap-2">
      <CardHeader icon={<Wind className="h-5 w-5 text-[#1d5fd6]" />} title="Wind Speed" badge={<Badge tone={tone} label={uiLabel(sev)} />} />
      <div className="min-h-0 flex-1">
        <Gauge min={0} max={120} value={kmh} segments={SEGMENTS} ticks={[0, 20, 40, 60, 80, 100, 120]} needle>
          <text x={100} y={135} textAnchor="middle" fontSize={26} fontWeight={700} fill={kmh === null ? "#8a9bb0" : "#0b2a5b"}>
            {kmh === null ? "N/A" : kmh.toFixed(0)}
          </text>
          <text x={100} y={148} textAnchor="middle" fontSize={10} fill="#33465e">km/h</text>
        </Gauge>
      </div>
      <div className="grid shrink-0 grid-cols-3 gap-2">
        <Stat label="Average" title="Average over the last hour" value={fmt(avg)} unit="km/h" />
        <Stat label="Gust" title="Peak speed over the last 30 minutes" value={fmt(gust)} unit="km/h" />
        <Stat label="Max Today" value={fmt(maxToday)} unit="km/h" />
      </div>
      <Notice tone={notice.tone} title={notice.title}>{notice.body}</Notice>
    </Card>
  );
}
