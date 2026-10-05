"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchCombinedLatestReading } from "@/lib/supabase/queries";
import type { CombinedReading } from "@/lib/supabase/types";
import { formatNormalizedError, normalizeSupabaseError } from "@/lib/supabase/errors";
import { useSensorDataRealtime } from "./useSensorDataRealtime";
import type { ChannelState } from "@/lib/supabase/realtimeBus";

/**
 * `connectionState` reflects the shared Realtime WEBSOCKET only.
 * `queryStatus` reflects whether the actual REST SELECT against
 * sensor_data has succeeded at least once. These are DELIBERATELY
 * separate — a websocket can subscribe successfully while the REST query
 * is still blocked (e.g. by RLS) or failing for an unrelated reason.
 */
export type { ChannelState } from "@/lib/supabase/realtimeBus";
export type QueryStatus = "idle" | "loading" | "success" | "error";

interface UseLatestReadingResult {
  data: CombinedReading | null;
  connectionState: ChannelState;
  queryStatus: QueryStatus;
  error: string | null;
  refresh: () => void;
}

// Always-on safety-net poll. Realtime is the primary update mechanism
// (via the shared bus below); this interval exists purely as a fallback
// in case an event type is ever missed or the socket silently stalls.
// 15s is intentionally conservative — not aggressive.
const POLL_INTERVAL_MS = Number(
  process.env.NEXT_PUBLIC_POLL_INTERVAL_MS ?? 15000
);

export function useLatestReading(): UseLatestReadingResult {
  const [data, setData] = useState<CombinedReading | null>(null);
  const [queryStatus, setQueryStatus] = useState<QueryStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const { lastEventAt, channelState } = useSensorDataRealtime();
  const isFirstEvent = useRef(true);

  const load = useCallback(async () => {
    setQueryStatus((prev) => (prev === "idle" ? "loading" : prev));
    try {
      const result = await fetchCombinedLatestReading();
      setData(result);
      setError(null);
      setQueryStatus("success");
    } catch (err) {
      const normalized = normalizeSupabaseError(err);
      setError(formatNormalizedError(normalized));
      setQueryStatus("error");
    }
  }, []);

  // Initial load, once.
  useEffect(() => {
    load();
  }, [load]);

  // Immediate refetch whenever the shared realtime bus reports a change
  // (INSERT or UPDATE) on sensor_data. Skip the very first call, since
  // lastEventAt starts at 0 and isn't a real event.
  useEffect(() => {
    if (isFirstEvent.current) {
      isFirstEvent.current = false;
      return;
    }
    load();
  }, [lastEventAt, load]);

  // Always-on low-frequency safety-net poll, independent of channelState.
  // Single interval per hook instance, cleared on unmount — no duplicates.
  useEffect(() => {
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load]);

  return { data, connectionState: channelState, queryStatus, error, refresh: load };
}
