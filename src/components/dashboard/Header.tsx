"use client";

import { ChevronDown } from "lucide-react";
import { STATION } from "@/lib/config";
import { formatStationTime } from "@/lib/utils/dashboard";
import { TONE } from "@/lib/utils/dashboard";
import { isDataStale } from "@/lib/utils/format";
import type { QueryStatus } from "@/hooks/useLatestReading";

const pill =
  "rounded-xl border border-white/80 bg-white/90 px-4 py-2.5 text-[12.5px] text-[#3d5363] shadow-[0_1px_2px_rgba(20,50,70,0.05),0_6px_16px_-10px_rgba(20,60,80,0.18)]";

export function Header({
  queryStatus, latestTimestamp,
}: { queryStatus: QueryStatus; latestTimestamp: string | null }) {
  const stale = isDataStale(latestTimestamp);
  const online = queryStatus === "success" && !stale;
  const label = queryStatus === "error" ? "STATION OFFLINE" : queryStatus !== "success" ? "CONNECTING" : stale ? "NO RECENT DATA" : "STATION ONLINE";
  const dot = online ? TONE.normal.dot : queryStatus === "error" ? TONE.danger.dot : TONE.warning.dot;

  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3.5">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-[#1f9d8c] text-[22px] font-semibold leading-none text-[#1f9d8c]">
          M
        </div>
        <div>
          <div className="text-[13px] font-bold tracking-[0.22em] text-[#1b7f72]">{STATION.platform}</div>
          <div className="text-[11px] tracking-[0.06em] text-[#5b6f7e]">{STATION.platformTagline}</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className={`${pill} flex items-center gap-2 uppercase tracking-[0.04em]`}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: dot }} />
          {label}
        </div>
        <div className={pill}>Last update: {formatStationTime(latestTimestamp)}</div>
        <div className={`${pill} relative flex items-center`}>
          <select
            aria-label="Station"
            className="cursor-pointer appearance-none bg-transparent pr-7 outline-none"
            defaultValue="s1"
          >
            <option value="s1">{STATION.stationName}</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-3.5 h-4 w-4 text-[#3d5363]" />
        </div>
      </div>
    </header>
  );
}
