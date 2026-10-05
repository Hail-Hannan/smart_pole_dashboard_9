import { ReactNode, CSSProperties } from "react";

export function Card({
  children, className = "", style,
}: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <section
      style={style}
      className={`flex min-h-0 flex-col overflow-hidden rounded-2xl border border-[#e1e9f3] bg-white p-3.5 shadow-[0_1px_2px_rgba(11,42,91,0.04),0_8px_20px_-14px_rgba(11,42,91,0.2)] ${className}`}
    >
      {children}
    </section>
  );
}

/** Icon + title (+ optional subtitle) on the left, optional badge on the right. */
export function CardHeader({
  icon, title, sub, badge, iconBg = "#eef3fb",
}: { icon: ReactNode; title: string; sub?: string; badge?: ReactNode; iconBg?: string }) {
  return (
    <div className="flex shrink-0 items-start justify-between gap-2">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: iconBg }}>
          {icon}
        </span>
        <div className="min-w-0">
          <h2 className="truncate text-[16px] font-bold leading-tight text-[#0b2a5b]">{title}</h2>
          {sub && <p className="truncate text-[11.5px] leading-tight text-[#5d7088]">{sub}</p>}
        </div>
      </div>
      {badge}
    </div>
  );
}
