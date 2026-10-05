export type Severity = "normal" | "warning" | "danger" | "unknown";

export interface ThresholdResult {
  severity: Severity;
  label: string;
}

const UNKNOWN: ThresholdResult = { severity: "unknown", label: "N/A" };

export function evaluateTemperature(value: number | null): ThresholdResult {
  if (value === null || Number.isNaN(value)) return UNKNOWN;
  if (value <= 30) return { severity: "normal", label: "NORMAL" };
  if (value <= 35) return { severity: "warning", label: "WARNING" };
  return { severity: "danger", label: "DANGER" };
}

export function evaluateHumidity(value: number | null): ThresholdResult {
  if (value === null || Number.isNaN(value)) return UNKNOWN;
  if (value <= 75) return { severity: "normal", label: "NORMAL" };
  if (value <= 90) return { severity: "warning", label: "WARNING" };
  return { severity: "danger", label: "DANGER" };
}

export function severityColor(severity: Severity): string {
  switch (severity) {
    case "normal":
      return "text-status-normal border-status-normal/40 bg-status-normal/10";
    case "warning":
      return "text-status-warning border-status-warning/40 bg-status-warning/10";
    case "danger":
      return "text-status-danger border-status-danger/40 bg-status-danger/10";
    default:
      return "text-slate-600 border-slate-400/40 bg-slate-400/10";
  }
}

export function severityDot(severity: Severity): string {
  switch (severity) {
    case "normal":
      return "bg-status-normal";
    case "warning":
      return "bg-status-warning";
    case "danger":
      return "bg-status-danger";
    default:
      return "bg-slate-500";
  }
}

/** Lightning proximity warning-zone classification (distance in km). */
export type LightningZone = "critical" | "warning" | "advisory" | "safe" | "unknown";

export function classifyLightningZone(distanceKm: number | null): LightningZone {
  if (distanceKm === null || Number.isNaN(distanceKm)) return "unknown";
  if (distanceKm <= 5) return "critical";
  if (distanceKm <= 10) return "warning";
  if (distanceKm <= 15) return "advisory";
  return "safe";
}

export function lightningZoneColor(zone: LightningZone): string {
  switch (zone) {
    case "critical":
      return "#ef4444";
    case "warning":
      return "#f59e0b";
    case "advisory":
      return "#eab308";
    case "safe":
      return "#22c55e";
    default:
      return "#64748b";
  }
}
