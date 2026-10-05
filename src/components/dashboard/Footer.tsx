import { STATION } from "@/lib/config";
import { MatrixLogo } from "./Header";

export function Footer() {
  return (
    <footer className="flex shrink-0 flex-wrap items-center justify-between gap-x-6 gap-y-1 bg-[#0b2a5b] px-6 py-2.5 text-white">
      <div className="flex items-center gap-4">
        <MatrixLogo size={24} color="#ffffff" />
        <span className="text-[13.5px] font-medium">{STATION.company}</span>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 text-[12.5px] text-white/90">
        {STATION.footerTagline.map((t, i) => (
          <span key={t} className="flex items-center gap-3">
            {i > 0 && <span className="text-white/40">|</span>}
            {t}
          </span>
        ))}
      </div>
    </footer>
  );
}
