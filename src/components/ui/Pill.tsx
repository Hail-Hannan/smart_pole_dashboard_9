import { Severity } from "@/lib/utils/thresholds";
import { TONE, uiLabel } from "@/lib/utils/dashboard";

export function Pill({ severity, label }: { severity: Severity; label?: string }) {
  const t = TONE[severity];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.08em]"
      style={{ color: t.text, backgroundColor: t.bg }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: t.dot }} />
      {label ?? uiLabel(severity)}
    </span>
  );
}
