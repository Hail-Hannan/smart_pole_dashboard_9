import { ReactNode } from "react";
import { Asterisk, CircleDashed, Clock, Diamond, Sun, Umbrella } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { STATION } from "@/lib/config";
import { TONE, feelsLike, lightDescription, uiLabel } from "@/lib/utils/dashboard";
import { evaluateCo, evaluateHumidity, evaluateLight, evaluateTemperature, type Severity } from "@/lib/utils/thresholds";
import { resolveCoDisplayValue } from "@/lib/utils/co";
import type { SensorDataRow } from "@/lib/supabase/types";
import type { DayRow } from "@/lib/supabase/queries";

function Tile({
  title, value, unit, severity, statusLabel, sub, icon,
}: {
  title: string; value: string; unit?: string; severity: Severity; statusLabel?: string; sub?: string; icon: ReactNode;
}) {
  const t = TONE[severity];
  return (
    <Card className="!px-[18px] !py-5">
      <h3 className="text-[13.5px] font-medium text-[#3d5363]">{title}</h3>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-[38px] font-bold leading-none tracking-[-0.03em] text-[#12283a]">{value}</span>
        {unit && <span className="text-[14px] text-[#8397a6]">{unit}</span>}
      </div>
      <div className="mt-4 flex items-center justify-between gap-2 text-[11px] text-[#5b6f7e]">
        <span className="flex min-w-0 items-center gap-1.5 truncate">
          <i className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: t.dot }} />
          <b className="font-bold" style={{ color: t.text }}>{statusLabel ?? uiLabel(severity)}</b>
          {sub && <span className="truncate">· {sub}</span>}
        </span>
        <span className="shrink-0 text-[#a3c4c6]">{icon}</span>
      </div>
    </Card>
  );
}

/** rising / falling / steady from the pressure history (≈3 h span, ±1 hPa). */
function pressureTrend(rows: DayRow[]): string {
  const pts = rows.filter((r) => r.pressure !== null).map((r) => ({ t: new Date(r.created_at).getTime(), p: r.pressure as number }));
  if (pts.length < 2) return "collecting";
  const last = pts[pts.length - 1];
  const target = last.t - 3 * 3600_000;
  const ref = pts.find((p) => p.t >= target) ?? pts[0];
  if (last.t - ref.t < 3600_000) return "collecting";
  const d = last.p - ref.p;
  return d > 1 ? "rising" : d < -1 ? "falling" : "steady";
}

export function KpiRow({ envRow, weatherRow, rows }: { envRow: SensorDataRow | null; weatherRow: SensorDataRow | null; rows: DayRow[] }) {
  const temp = envRow?.temperature ?? null;
  const hum = envRow?.humidity ?? null;
  const light = envRow?.light_level ?? null;
  const co = resolveCoDisplayValue(envRow?.co_ppm ?? null);
  const pressure = weatherRow?.pressure ?? null;
  const rain = weatherRow?.rain ?? null;
  const feels = feelsLike(temp, hum);
  const ic = { size: 20, strokeWidth: 1.5 };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <Tile title="Temperature" value={temp === null ? "—" : temp.toFixed(1)} unit="°C"
        severity={evaluateTemperature(temp).severity}
        sub={feels === null ? undefined : `Feels like ${feels.toFixed(1)} °C`} icon={<Sun {...ic} />} />
      <Tile title="Humidity" value={hum === null ? "—" : hum.toFixed(0)} unit="%RH"
        severity={evaluateHumidity(hum).severity} sub="Relative humidity" icon={<CircleDashed {...ic} />} />
      <Tile title="Atmospheric pressure" value={pressure === null ? "—" : pressure.toFixed(0)} unit="hPa"
        severity="unknown" statusLabel="INFO" sub={`Trend: ${pressureTrend(rows)}`} icon={<Clock {...ic} />} />
      <Tile title="Carbon monoxide · CO" value={co.value === null ? "—" : co.value.toFixed(1)} unit="ppm"
        severity={evaluateCo(co.value).severity} sub="Limit < 9 ppm" icon={<Diamond {...ic} />} />
      <Tile title="Light level" value={light === null ? "—" : light.toLocaleString("en-US")} unit={STATION.lightUnit}
        severity={evaluateLight(light).severity} sub={lightDescription(light)} icon={<Asterisk {...ic} />} />
      <Tile title="Rain status" value={rain === null ? "—" : rain ? "Raining" : "Dry"}
        severity={rain === null ? "unknown" : rain ? "warning" : "normal"}
        statusLabel={rain === null ? "N/A" : rain ? "CAUTION" : "NORMAL"} sub="Rain sensor" icon={<Umbrella {...ic} />} />
    </div>
  );
}
