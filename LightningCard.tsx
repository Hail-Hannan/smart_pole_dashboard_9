import { Card, CardTitle } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { TONE, agoLong } from "@/lib/utils/dashboard";
import { isDataStale } from "@/lib/utils/format";
import type { Severity } from "@/lib/utils/thresholds";
import type { SensorDataRow } from "@/lib/supabase/types";

const ZONES: { km: number; name: string; sev: Severity; bg: string; text: string }[] = [
  { km: 5, name: "Critical", sev: "danger", bg: "#fde0e0", text: "#b42318" },
  { km: 10, name: "Warning", sev: "warning", bg: "#fdf0c4", text: "#8a5309" },
  { km: 15, name: "Advisory", sev: "normal", bg: "#dcf3e4", text: "#166534" },
];

const SURFACE: Record<Severity, { bg: string; border: string; big: string }> = {
  warning: { bg: "linear-gradient(180deg,#fff7e8,#fffbf3)", border: "#f7e4bd", big: "#9a5a0c" },
  danger: { bg: "linear-gradient(180deg,#fff0f0,#fff8f8)", border: "#f8d2d2", big: "#b42318" },
  normal: { bg: "linear-gradient(180deg,#ffffff,#fbfefc)", border: "#ffffffcc", big: "#12283a" },
  unknown: { bg: "linear-gradient(180deg,#ffffff,#fbfdfe)", border: "#ffffffcc", big: "#5b6f7e" },
};

export function LightningCard({ weatherRow }: { weatherRow: SensorDataRow | null }) {
  const type = weatherRow?.xweather_reading_type ?? null;
  const unavailable = type === null || type === "UNAVAILABLE";
  const active = !unavailable && weatherRow?.xweather_lightning === true;
  const d = weatherRow?.xweather_lightning_distance_km ?? null;
  const dist = d !== null && d >= 0 ? d : null;
  const stale = isDataStale(weatherRow?.created_at ?? null, 60_000);
  const readingLabel = unavailable ? "Feed unavailable" : stale ? "Last known reading" : "Live reading";

  // Badge severity: any strike inside 5 km is an alert, inside 15 km a caution.
  let sev: Severity = unavailable ? "unknown" : "normal";
  if (active) sev = dist !== null && dist <= 5 ? "danger" : dist === null || dist <= 15 ? "warning" : "normal";
  const label = unavailable ? "N/A" : sev === "danger" ? "ALERT" : sev === "warning" ? "CAUTION" : "CLEAR";
  const surface = SURFACE[sev];

  return (
    <Card className="flex h-full flex-col" style={{ background: surface.bg, borderColor: surface.border }}>
      <div className="flex items-start justify-between">
        <CardTitle>Lightning proximity</CardTitle>
        <Pill severity={sev} label={label} />
      </div>

      <div className="mt-5 flex items-baseline gap-2">
        <span className="text-[40px] font-bold leading-none tracking-[-0.03em]" style={{ color: surface.big }}>
          {active ? (dist === null ? "—" : `${dist >= 10 ? Math.round(dist) : dist.toFixed(1)} km`) : unavailable ? "N/A" : "None"}
        </span>
        <span className="text-[15px] text-[#7a8fa0]">{active ? "nearest strike" : unavailable ? "" : "detected"}</span>
      </div>
      <p className="mt-2 text-[12.5px] text-[#4a6070]">{readingLabel} · updated {agoLong(weatherRow?.created_at ?? null)}</p>

      <div className="mt-auto space-y-2.5 pt-5">
        {ZONES.map((z) => {
          const count = active && dist !== null && dist <= z.km ? 1 : 0;
          return (
            <div key={z.km} className="flex items-center justify-between rounded-xl px-3.5 py-2.5 text-[12px]" style={{ backgroundColor: z.bg, color: z.text }}>
              <span className="flex items-center gap-2.5">
                <i className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: TONE[z.sev].dot }} />
                Within {z.km} km
              </span>
              <b className="font-semibold">{z.name}{count > 0 ? ` · ${count}` : ""}</b>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
