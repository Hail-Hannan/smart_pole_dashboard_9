"use client";

import { useEffect, useRef, useState } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  fetchRecentRawRows,
  mergeRowsForDisplay,
  MergedRecord,
} from "@/lib/supabase/queries";
import { formatNormalizedError, normalizeSupabaseError } from "@/lib/supabase/errors";
import { useSensorDataRealtime } from "./useSensorDataRealtime";

interface UseRecentRecordsResult {
  records: MergedRecord[];
  loading: boolean;
  error: string | null;
}

/**
 * pollMs is a SAFETY-NET interval, not the primary update mechanism —
 * the shared realtime bus (see useSensorDataRealtime) triggers an
 * immediate refetch on every INSERT/UPDATE. This interval just guards
 * against a missed/duplicated event.
 */
export function useRecentRecords(pollMs = 20000): UseRecentRecordsResult {
  const [records, setRecords] = useState<MergedRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { lastEventAt } = useSensorDataRealtime();
  const isFirstEvent = useRef(true);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      setError("Supabase not configured");
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const raw = await fetchRecentRawRows(60);
        if (cancelled) return;
        setRecords(mergeRowsForDisplay(raw).slice(0, 20));
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(formatNormalizedError(normalizeSupabaseError(err)));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    // Always-on safety-net poll; single interval, cleared on unmount.
    const interval = setInterval(load, pollMs);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pollMs]);

  // Immediate refetch on realtime event (INSERT or UPDATE), independent
  // of the interval above.
  useEffect(() => {
    if (isFirstEvent.current) {
      isFirstEvent.current = false;
      return;
    }
    if (!isSupabaseConfigured()) return;
    let cancelled = false;
    fetchRecentRawRows(60)
      .then((raw) => {
        if (!cancelled) setRecords(mergeRowsForDisplay(raw).slice(0, 20));
      })
      .catch((err) => {
        if (!cancelled) setError(formatNormalizedError(normalizeSupabaseError(err)));
      });
    return () => {
      cancelled = true;
    };
  }, [lastEventAt]);

  return { records, loading, error };
}
