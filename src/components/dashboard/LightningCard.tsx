import { Zap } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Notice } from "@/components/ui/Notice";
import { formatClockSeconds } from "@/lib/utils/dashboard";
import { isDataStale } from "@/lib/utils/format";
import { classifyLightningZone, type LightningZone } from "@/lib/utils/thresholds";
import type { SensorDataRow } from "@/lib/supabase/types";

const ZONE_UI: Record<LightningZone, { label: string; tone: BadgeTone; text: string }> = {
  critical: { label: "HIGH RISK", tone: "danger", text: "#e11d1d" },
  warning: { label: "CAUTION", tone: "orange", text: "#e8830f" },
  advisory: { label: "WATCH", tone: "warning", text: "#b8860b" },
  safe: { label: "SAFE", tone: "normal", text: "#22a559" },
  unknown: { label: "UNAVAILABLE", tone: "unknown", text: "#5d7088" },
};

const LEGEND = [
  { dot: "#ef4444", range: "0 – 5 km", label: "High Risk", text: "#e11d1d" },
  { dot: "#f59e0b", range: "5 – 10 km", label: "Caution", text: "#e8830f" },
  { dot: "#facc15", range: "10 – 15 km", label: "Watch", text: "#b8860b" },
  { dot: "#22c55e", range: "> 15 km", label: "Safe", text: "#22a559" },
];

const R = 92;
const SCALE_KM = 20;
const rad = (km: number) => (Math.min(km, SCALE_KM) / SCALE_KM) * R;

export function LightningCard({ weatherRow }: { weatherRow: SensorDataRow | null }) {
  const type = weatherRow?.xweather_reading_type ?? null;
  const unavailable = type === null || type === "UNAVAILABLE";
  const active = !unavailable && weatherRow?.xweather_lightning === true;
  const d = weatherRow?.xweather_lightning_distance_km ?? null;
  const dist = d !== null && d >= 0 ? d : null;
  const stale = isDataStale(weatherRow?.created_at ?? null, 60_000);

  const zone: LightningZone = unavailable ? "unknown" : !active ? "safe" : dist === null ? "warning" : classifyLightningZone(dist);
  const ui = ZONE_UI[zone];
  const source = unavailable ? "UNAVAILABLE" : type === "LAST_KNOWN" || stale ? "LAST KNOWN" : "LIVE";
  const ts = active && weatherRow?.xweather_reading_timestamp ? weatherRow.xweather_reading_timestamp * 1000 : null;

  const distText = unavailable ? "N/A" : !active ? "None" : dist === null ? "N/A" : `${dist.toFixed(1)} km`;
  const notice: { tone: BadgeTone; title: string; body: string } =
    zone === "critical" ? { tone: "danger", title: "Lightning within 5 km!", body: "Seek shelter immediately." }
    : zone === "warning" ? { tone: "orange", title: "Lightning within 10 km", body: "Be prepared to suspend outdoor activity." }
    : zone === "advisory" ? { tone: "warning", title: "Lightning within 15 km", body: "Monitor conditions closely." }
    : zone === "unknown" ? { tone: "unknown", title: "Lightning data unavailable", body: "Do not assume conditions are clear." }
    : active ? { tone: "normal", title: "Lightning detected over 15 km away", body: "No immediate threat." }
    : { tone: "normal", title: "No lightning detected", body: "No strikes reported in the monitoring area." };

  return (
    <Card className="h-full gap-2">
      <CardHeader
        icon={<Zap className="h-5 w-5 text-[#e11d1d]" fill="#e11d1d" />}
        iconBg="#fdecec"
        title="Lightning Detection"
        sub={`Distance to nearest strike · ${source}`}
        badge={<Badge tone={ui.tone} label={ui.label} />}
      />

      <div className="flex min-h-0 flex-1 items-center gap-3">
        <div className="h-full min-h-0 min-w-0 flex-1">
          <svg viewBox="0 0 200 200" className="h-full w-full" aria-label="Lightning distance rings">
            <g transform="translate(100,100)">
              <circle r={R} fill="#dff5e6" stroke="#bfe7cb" />
              <circle r={rad(15)} fill="#fff4c2" stroke="#f3dc80" />
              <circle r={rad(10)} fill="#ffdcb0" stroke="#f6bb70" />
              <circle r={rad(5)} fill="#fbb4b4" stroke="#ef8a8a" />
              {active && dist !== null && (
                <circle r={rad(dist)} fill="none" stroke="#0b2a5b" strokeWidth={1.8} strokeDasharray="4 3" />
              )}
              <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" transform="translate(-10,-17) scale(0.85)" fill={unavailable ? "#8a9bb0" : "#f59e0b"} stroke="#fff" strokeWidth={1.2} strokeLinejoin="round" />
              {[5, 10, 15].map((km) => (
                <text key={km} x={0} y={rad(km) - 3} textAnchor="middle" fontSize={8} fontWeight={600} fill="#33465e">{km} km</text>
              ))}
            </g>
          </svg>
        </div>

        <div className="flex w-[42%] min-w-[150px] shrink-0 flex-col justify-center gap-2">
          <div className="rounded-xl border border-[#e6edf6] bg-[#f8fafd] px-3 py-2">
            <div className="text-[12px] font-bold text-[#0b2a5b]">Nearest Strike</div>
            <div className="text-[28px] font-bold leading-tight" style={{ color: ui.text }}>{distText}</div>
            <div className="mt-1 text-[11px] text-[#5d7088]">Direction</div>
            <div className="text-[13px] font-semibold text-[#8a9bb0]">N/A</div>
            <div className="mt-1 text-[11px] text-[#5d7088]">Last Detected</div>
            <div className="text-[14px] font-bold text-[#0b2a5b]">{ts ? formatClockSeconds(ts) : "—"}</div>
          </div>
          <ul className="space-y-1">
            {LEGEND.map((l) => (
              <li key={l.label} className="flex items-center gap-2 text-[11.5px] text-[#33465e]">
                <i className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: l.dot }} />
                <span className="w-[68px] shrink-0 whitespace-nowrap">{l.range}</span>
                <b style={{ color: l.text }}>{l.label}</b>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <Notice tone={notice.tone} title={notice.title}>{notice.body}</Notice>
    </Card>
  );
}
