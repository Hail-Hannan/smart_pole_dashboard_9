import { Sun } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Notice } from "@/components/ui/Notice";

/** The station does not currently report solar radiation, so this card shows N/A (no invented values). */
export function SolarCard() {
  return (
    <Card className="shrink-0 gap-2">
      <CardHeader icon={<Sun className="h-5 w-5 text-[#f59e0b]" />} iconBg="#fff4d6" title="Solar Radiation" badge={<Badge tone="unknown" label="UNAVAILABLE" />} />
      <div className="flex h-[66px] items-center gap-3">
        <div className="flex h-full min-w-[84px] flex-col items-center justify-center rounded-xl border border-[#e6edf6] bg-[#f8fafd] px-3">
          <span className="text-[22px] font-bold leading-tight text-[#8a9bb0]">N/A</span>
          <span className="text-[12px] text-[#5d7088]">W/m²</span>
        </div>
        <div className="min-w-0 flex-1">
          <Notice tone="unknown" title="No solar data">No solar radiation reading is reported by the station.</Notice>
        </div>
      </div>
    </Card>
  );
}
