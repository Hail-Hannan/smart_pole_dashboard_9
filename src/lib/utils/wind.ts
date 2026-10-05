/**
 * Mirrors getWindDirectionName()/getWindDirectionShort() in the ESP32-B
 * firmware exactly (same 16-point boundaries), so the dashboard's compass
 * label always matches what the device itself would report.
 */
const COMPASS_POINTS: { max: number; name: string; short: string }[] = [
  { max: 11.25, name: "North", short: "N" },
  { max: 33.75, name: "North-Northeast", short: "NNE" },
  { max: 56.25, name: "Northeast", short: "NE" },
  { max: 78.75, name: "East-Northeast", short: "ENE" },
  { max: 101.25, name: "East", short: "E" },
  { max: 123.75, name: "East-Southeast", short: "ESE" },
  { max: 146.25, name: "Southeast", short: "SE" },
  { max: 168.75, name: "South-Southeast", short: "SSE" },
  { max: 191.25, name: "South", short: "S" },
  { max: 213.75, name: "South-Southwest", short: "SSW" },
  { max: 236.25, name: "Southwest", short: "SW" },
  { max: 258.75, name: "West-Southwest", short: "WSW" },
  { max: 281.25, name: "West", short: "W" },
  { max: 303.75, name: "West-Northwest", short: "WNW" },
  { max: 326.25, name: "Northwest", short: "NW" },
  { max: 348.75, name: "North-Northwest", short: "NNW" },
  { max: 360.01, name: "North", short: "N" },
];

export function windDirectionName(angle: number | null): string {
  if (angle === null || Number.isNaN(angle)) return "Unknown";
  const normalized = ((angle % 360) + 360) % 360;
  const point = COMPASS_POINTS.find((p) => normalized < p.max);
  return point ? point.name : "Unknown";
}

export function windDirectionShort(angle: number | null): string {
  if (angle === null || Number.isNaN(angle)) return "—";
  const normalized = ((angle % 360) + 360) % 360;
  const point = COMPASS_POINTS.find((p) => normalized < p.max);
  return point ? point.short : "—";
}
