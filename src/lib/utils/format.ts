/**
 * warning_found is a TEXT column that may contain "true", "false",
 * "NOT CHECKED", or null. Never treat it as a native boolean.
 */
export function parseWarningFound(
  raw: string | null
): { known: boolean; active: boolean; raw: string } {
  if (raw === null) return { known: false, active: false, raw: "N/A" };
  const normalized = raw.trim().toLowerCase();
  if (normalized === "true" || normalized === "yes") {
    return { known: true, active: true, raw };
  }
  if (normalized === "false" || normalized === "no") {
    return { known: true, active: false, raw };
  }
  return { known: false, active: false, raw };
}

export function formatValue(
  value: number | null | undefined,
  unit = "",
  decimals = 1
): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "N/A";
  }
  return `${value.toFixed(decimals)}${unit ? ` ${unit}` : ""}`;
}

export function formatBoolean(
  value: boolean | null | undefined,
  yes = "Yes",
  no = "No"
): string {
  if (value === null || value === undefined) return "N/A";
  return value ? yes : no;
}

export function formatRelativeTime(iso: string | null): string {
  if (!iso) return "No data yet";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "Unknown";
  const diffMs = Date.now() - then;
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 5) return "Just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

export function formatClockTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/**
 * Data staleness check for connectivity indicators. If the most recent row
 * is older than staleMs, we should not claim the device is "online" just
 * because the website itself loaded.
 */
export function isDataStale(iso: string | null, staleMs = 90_000): boolean {
  if (!iso) return true;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return true;
  return Date.now() - then > staleMs;
}

/**
 * Formats an Xweather lightning distance. Null/undefined means "no data".
 * A negative value (firmware sentinel, e.g. -1) means "no distance
 * available" and must never render as "-1.00 km" — both cases show N/A.
 */
export function formatXweatherDistance(
  distanceKm: number | null | undefined
): string {
  if (distanceKm === null || distanceKm === undefined || Number.isNaN(distanceKm)) {
    return "N/A";
  }
  if (distanceKm < 0) return "N/A";
  return `${distanceKm.toFixed(2)} km`;
}