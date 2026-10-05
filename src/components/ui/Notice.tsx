import { ReactNode } from "react";
import { AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import type { BadgeTone } from "./Badge";

const TONES: Record<BadgeTone, { bg: string; fg: string; icon: string }> = {
  danger: { bg: "#fdecec", fg: "#c81e1e", icon: "#e11d1d" },
  orange: { bg: "#fff0e0", fg: "#b45309", icon: "#f28c1b" },
  warning: { bg: "#fff6d9", fg: "#946200", icon: "#e0a400" },
  normal: { bg: "#e6f6ec", fg: "#166534", icon: "#22a559" },
  unknown: { bg: "#eef2f7", fg: "#475569", icon: "#8a9bb0" },
  info: { bg: "#e8f0fd", fg: "#1e4fa8", icon: "#1d5fd6" },
};

export function Notice({ tone, title, children }: { tone: BadgeTone; title: string; children?: ReactNode }) {
  const t = TONES[tone];
  const Icon = tone === "danger" || tone === "orange" || tone === "warning" ? AlertTriangle : tone === "normal" ? CheckCircle2 : Info;
  return (
    <div className="flex shrink-0 items-center gap-3 rounded-xl px-3.5 py-2.5" style={{ backgroundColor: t.bg, color: t.fg }}>
      <Icon className="h-7 w-7 shrink-0" strokeWidth={1.8} style={{ color: t.icon }} />
      <div className="min-w-0 leading-tight">
        <div className="text-[13.5px] font-bold">{title}</div>
        {children && <div className="mt-0.5 text-[11.5px] opacity-90">{children}</div>}
      </div>
    </div>
  );
}
