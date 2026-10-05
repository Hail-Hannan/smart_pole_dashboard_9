"use client";

import { useEffect, useState } from "react";
import { CalendarDays, MapPin, MoreVertical, Wifi } from "lucide-react";
import { STATION } from "@/lib/config";
import { formatHeaderDateTime } from "@/lib/utils/dashboard";
import { isDataStale } from "@/lib/utils/format";
import type { QueryStatus } from "@/hooks/useLatestReading";

export function MatrixLogo({ size = 30, color = "#0b2a5b" }: { size?: number; color?: string }) {
  return (
    <span className="inline-flex items-baseline font-black leading-none tracking-[0.02em]" style={{ fontSize: size, color }}>
      MATR
      <span className="relative inline-block">
        ı<i className="absolute left-1/2 rounded-full bg-[#e11d1d]" style={{ width: size * 0.2, height: size * 0.2, top: -size * 0.04, transform: "translateX(-50%)" }} />
      </span>
      X
    </span>
  );
}

const box = "flex items-center gap-2.5 rounded-xl border border-[#e1e9f3] bg-white px-3.5 py-2 shadow-[0_1px_2px_rgba(11,42,91,0.04)]";

export function Header({ queryStatus, latestTimestamp }: { queryStatus: QueryStatus; latestTimestamp: string | null }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const stale = isDataStale(latestTimestamp);
  const online = queryStatus === "success" && !stale;
  const label = queryStatus === "error" ? "Offline" : queryStatus !== "success" ? "Connecting" : stale ? "No recent data" : "Online";
  const bg = online ? "#22a559" : queryStatus === "error" ? "#e11d1d" : "#f28c1b";

  return (
    <header className="flex shrink-0 flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 pb-1 pt-3">
      <div className="flex min-w-0 items-center gap-5">
        <div className="leading-none">
          <MatrixLogo />
          <div className="mt-1 text-[16px] font-bold leading-none text-[#0b2a5b]">{STATION.product}</div>
        </div>
        <div className="hidden border-l border-[#d5e0ee] pl-5 text-[15px] leading-snug text-[#0b2a5b] lg:block">
          {STATION.taglineLines.map((l) => <div key={l}>{l}</div>)}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className={`${box} hidden md:flex`}>
          <MapPin className="h-5 w-5 text-[#0b2a5b]" />
          <div className="leading-tight">
            <div className="text-[10.5px] text-[#5d7088]">Site Location</div>
            <div className="text-[13px] font-medium text-[#0b2a5b]">{STATION.location}</div>
          </div>
        </div>
        <div className={`${box} hidden sm:flex`}>
          <CalendarDays className="h-5 w-5 text-[#0b2a5b]" />
          <div className="leading-tight">
            <div className="text-[10.5px] text-[#5d7088]">Date &amp; Time</div>
            <div className="min-w-[150px] whitespace-pre text-[13px] font-medium text-[#0b2a5b]">{now === null ? " " : formatHeaderDateTime(now)}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-full px-4 py-2.5 text-[14px] font-semibold text-white" style={{ backgroundColor: bg }}>
          <Wifi className="h-4 w-4" />
          {label}
        </div>
        <MoreVertical className="h-5 w-5 text-[#0b2a5b]" aria-hidden />
      </div>
    </header>
  );
}
