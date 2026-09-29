import { ReactNode, CSSProperties } from "react";

export function Card({
  children, className = "", style,
}: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <section
      style={style}
      className={`rounded-[26px] border border-white/80 bg-white/85 p-6 shadow-[0_1px_2px_rgba(20,50,70,0.04),0_10px_30px_-14px_rgba(20,60,80,0.16)] backdrop-blur ${className}`}
    >
      {children}
    </section>
  );
}

export function CardTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-[14.5px] font-medium tracking-[-0.005em] text-[#3d5363]">{children}</h2>;
}
