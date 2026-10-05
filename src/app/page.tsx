"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { useLatestReading } from "@/hooks/useLatestReading";
import { useLastHours } from "@/hooks/useLastHours";

const POLL_S = Math.round(Number(process.env.NEXT_PUBLIC_POLL_INTERVAL_MS ?? 15000) / 1000);

export default function DashboardPage() {
  const { data, connectionState, queryStatus, error } = useLatestReading();
  const { rows } = useLastHours(24);

  // Re-render every 5 s so "x seconds ago" and freshness labels stay current.
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 5000);
    return () => clearInterval(t);
  }, []);

  if (connectionState === "unconfigured") {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-md rounded-3xl border border-red-200 bg-white/90 p-6 text-center shadow-lg">
          <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-red-600" />
          <h2 className="mb-2 text-lg font-bold text-[#12283a]">Supabase not configured</h2>
          <p className="text-sm text-[#4a6070]">
            Set <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in your environment to connect this dashboard to the sensor_data table.
          </p>
        </div>
      </div>
    );
  }

  return (
    <DashboardView
      envRow={data?.envRow ?? null}
      weatherRow={data?.weatherRow ?? null}
      rows={rows}
      queryStatus={queryStatus}
      latestTimestamp={data?.latestTimestamp ?? null}
      updateSeconds={POLL_S}
      error={error}
    />
  );
}
