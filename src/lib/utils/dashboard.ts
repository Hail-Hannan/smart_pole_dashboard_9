import type { Severity } from "./thresholds";

export const msToKmh = (v: number) => v * 3.6;

/** UI vocabulary: Normal / Caution / Alert (maps the existing severities). */
export function uiLabel(s: Severity): string {
  return s === "normal" ? "NORMAL" : s === "warning" ? "CAUTION" : s === "danger" ? "ALERT" : "N/A";
}

export const TONE: Record<Severity, { text: string; bg: string; dot: string }> = {
  normal: { text: "#15803d", bg: "#dcf3e4", dot: "#16a34a" },
  warning: { text: "#a45f06", bg: "#fdecc8", dot: "#d97706" },
  danger: { text: "#b91c1c", bg: "#fbdada", dot: "#dc2626" },
  unknown: { text: "#5b6f7e", bg: "#e7eef3", dot: "#94a3b8" },
};

/** Beaufort scale from m/s. */
const BEAUFORT = [
  [0.3, "Calm"], [1.6, "Light air"], [3.4, "Light breeze"], [5.5, "Gentle breeze"],
  [8.0, "Moderate breeze"], [10.8, "Fresh breeze"], [13.9, "Strong breeze"], [17.2, "Near gale"],
  [20.8, "Gale"], [24.5, "Strong gale"], [28.5, "Storm"], [32.7, "Violent storm"],
] as const;

export function beaufort(ms: number | null): { force: number; name: string } {
  if (ms === null || Number.isNaN(ms)) return { force: -1, name: "—" };
  const i = BEAUFORT.findIndex(([max]) => ms < max);
  return i === -1 ? { force: 12, name: "Hurricane force" } : { force: i, name: BEAUFORT[i][1] };
}

export function windSeverity(ms: number | null): Severity {
  const { force } = beaufort(ms);
  if (force < 0) return "unknown";
  return force <= 5 ? "normal" : force <= 7 ? "warning" : "danger";
}

/** Heat index (Rothfusz regression); falls back to air temperature when not applicable. */
export function feelsLike(tC: number | null, rh: number | null): number | null {
  if (tC === null || rh === null) return null;
  const t = tC * 1.8 + 32;
  if (t < 80 || rh < 40) return tC;
  const hi =
    -42.379 + 2.04901523 * t + 10.14333127 * rh - 0.22475541 * t * rh - 0.00683783 * t * t -
    0.05481717 * rh * rh + 0.00122874 * t * t * rh + 0.00085282 * t * rh * rh -
    0.00000199 * t * t * rh * rh;
  return (hi - 32) / 1.8;
}

const tz = "Asia/Kuala_Lumpur";

export function formatStationTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const p = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz, day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(d);
  const g = (t: string) => p.find((x) => x.type === t)?.value ?? "";
  const mon = new Intl.DateTimeFormat("en-US", { timeZone: tz, month: "short" }).format(d);
  return `${g("day")} ${mon} ${g("year")} · ${g("hour")}:${g("minute")} MYT`;
}

export function formatHourMinute(ms: number): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(ms));
}

export function agoLong(iso: string | null): string {
  if (!iso) return "no data yet";
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (Number.isNaN(s)) return "unknown";
  if (s < 5) return "just now";
  if (s < 60) return `${s} seconds ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} minute${m === 1 ? "" : "s"} ago`;
  const h = Math.floor(m / 60);
  return `${h} hour${h === 1 ? "" : "s"} ago`;
}

export function freshnessText(iso: string | null): string {
  if (!iso) return "No data";
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (Number.isNaN(s)) return "Unknown";
  if (s < 60) return "< 1 minute";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} minute${m === 1 ? "" : "s"}`;
  const h = Math.floor(m / 60);
  return `${h} hour${h === 1 ? "" : "s"}`;
}

export function formatClockSeconds(ms: number): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(new Date(ms));
}

export function formatHeaderDateTime(ms: number): string {
  const d = new Date(ms);
  const day = new Intl.DateTimeFormat("en-GB", { timeZone: tz, day: "2-digit" }).format(d);
  const mon = new Intl.DateTimeFormat("en-US", { timeZone: tz, month: "short" }).format(d);
  const year = new Intl.DateTimeFormat("en-GB", { timeZone: tz, year: "numeric" }).format(d);
  return `${day} ${mon} ${year}   ${formatClockSeconds(ms)}`;
}
