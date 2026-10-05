import type { DayRow } from "@/lib/supabase/queries";

const MYT_OFFSET = 8 * 3600_000; // Asia/Kuala_Lumpur, no DST
const DAY = 86_400_000;

/** Epoch ms of 00:00 today in Malaysia time. */
export const startOfTodayMs = (now = Date.now()) => Math.floor((now + MYT_OFFSET) / DAY) * DAY - MYT_OFFSET;

export const rowsSince = (rows: DayRow[], sinceMs: number) =>
  rows.filter((r) => new Date(r.created_at).getTime() >= sinceMs);

export function average(vals: number[]): number | null {
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
}

/** Row holding the max/min of a field, or null when no row has a value. */
export function extreme(
  rows: DayRow[], pick: (r: DayRow) => number | null, kind: "max" | "min"
): { value: number; at: number } | null {
  let best: { value: number; at: number } | null = null;
  for (const r of rows) {
    const v = pick(r);
    if (v === null || Number.isNaN(v)) continue;
    if (best === null || (kind === "max" ? v > best.value : v < best.value)) {
      best = { value: v, at: new Date(r.created_at).getTime() };
    }
  }
  return best;
}

export const nums = (rows: DayRow[], pick: (r: DayRow) => number | null): number[] =>
  rows.map(pick).filter((v): v is number => v !== null && !Number.isNaN(v));
