export function Stat({ label, value, unit, title }: { label: string; value: string; unit?: string; title?: string }) {
  const na = value === "N/A";
  return (
    <div title={title} className="flex min-w-0 flex-col items-center justify-center rounded-xl border border-[#e6edf6] bg-[#f6f9fd] px-2 py-1 text-center">
      <span className="text-[11.5px] text-[#5d7088]">{label}</span>
      <span className={`text-[19px] font-bold leading-tight ${na ? "text-[#8a9bb0]" : "text-[#0b2a5b]"}`}>
        {value}
        {unit && !na && <span className="ml-1 text-[11px] font-normal text-[#5d7088]">{unit}</span>}
      </span>
    </div>
  );
}
