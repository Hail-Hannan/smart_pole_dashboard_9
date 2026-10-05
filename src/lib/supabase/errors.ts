/**
 * Normalizes any thrown value into a display-ready shape, WITHOUT ever
 * collapsing a real Supabase/PostgREST error into a generic string.
 *
 * Why this exists: @supabase/supabase-js (postgrest-js) does not always
 * throw/return a real `Error` instance. A parsed API error body comes back
 * as `{ message, details, hint, code }`. A network-level failure (DNS,
 * CORS, TLS, connection refused) is caught internally and re-wrapped as a
 * PLAIN OBJECT with the same shape — NOT an `instanceof Error`. Code that
 * does `err instanceof Error ? err.message : "Unknown error"` silently
 * discards the real message in that second case. This function checks for
 * the actual fields instead of relying on `instanceof`.
 */
export interface NormalizedError {
  message: string;
  details: string | null;
  hint: string | null;
  code: string | null;
}

export function normalizeSupabaseError(err: unknown): NormalizedError {
  // Always log the raw, un-normalized value so it's inspectable in the
  // browser console/devtools network tab, even if our summary is imperfect.
  // eslint-disable-next-line no-console
  console.error("[Supabase error]", err);

  if (err && typeof err === "object") {
    const obj = err as Record<string, unknown>;
    const message =
      typeof obj.message === "string" && obj.message.length > 0
        ? obj.message
        : err instanceof Error
        ? err.message
        : null;

    if (message) {
      return {
        message,
        details: typeof obj.details === "string" ? obj.details : null,
        hint: typeof obj.hint === "string" ? obj.hint : null,
        code: typeof obj.code === "string" ? obj.code : null,
      };
    }
  }

  if (typeof err === "string" && err.length > 0) {
    return { message: err, details: null, hint: null, code: null };
  }

  return {
    message: "An unrecognized error occurred. Check the browser console for the raw object.",
    details: null,
    hint: null,
    code: null,
  };
}

export function formatNormalizedError(e: NormalizedError): string {
  const parts = [e.message];
  if (e.code) parts.push(`code=${e.code}`);
  if (e.details) parts.push(`details=${e.details}`);
  if (e.hint) parts.push(`hint=${e.hint}`);
  return parts.join(" · ");
}
