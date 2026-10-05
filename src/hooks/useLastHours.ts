"use client";

import { useEffect, useRef, useState } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { fetchLastHours, type DayRow } from "@/lib/supabase/queries";
import { useSensorDataRealtime } from "./useSensorDataRealtime";

/** Last-24h rows, refreshed every 60 s and on realtime events (throttled). */
export function useLastHours(hours = 24) {
  const [rows, setRows] = useState<DayRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { lastEventAt } = useSensorDataRealtime();
  const lastLoad = useRef(0);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    const load = async () => {
      lastLoad.current = Date.now();
      try {
        const data = await fetchLastHours(hours);
        if (!cancelled) setRows(data);
      } catch {
        /* keep previous rows */
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    const t = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [hours]);

  // Realtime nudge, throttled to once per 20 s so a chatty table doesn't hammer the query.
  useEffect(() => {
    if (!lastEventAt || !isSupabaseConfigured()) return;
    if (Date.now() - lastLoad.current < 20_000) return;
    lastLoad.current = Date.now();
    fetchLastHours(hours).then(setRows).catch(() => {});
  }, [lastEventAt, hours]);

  return { rows, loading };
}
