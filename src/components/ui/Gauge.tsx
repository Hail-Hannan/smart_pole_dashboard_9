import { ReactNode } from "react";

export interface GaugeSegment { from: number; to: number; color: string }

/** Semicircular gauge. Draws only what it is given; value === null shows no needle/marker. */
export function Gauge({
  min, max, value, segments, ticks, needle = false, children,
}: {
  min: number; max: number; value: number | null; segments: GaugeSegment[];
  ticks: number[]; needle?: boolean; children?: ReactNode;
}) {
  const cx = 100, cy = 100, R = 80;
  const clamp = (v: number) => Math.min(Math.max(v, min), max);
  const pt = (v: number, r: number): [number, number] => {
    const t = Math.PI * (1 - (clamp(v) - min) / (max - min));
    return [cx + r * Math.cos(t), cy - r * Math.sin(t)];
  };
  const arc = (a: number, b: number) => {
    const [x1, y1] = pt(a, R);
    const [x2, y2] = pt(b, R);
    return `M ${x1} ${y1} A ${R} ${R} 0 0 1 ${x2} ${y2}`;
  };
  const tip = value === null ? null : pt(value, R - 20);
  const mark = value === null ? null : pt(value, R);

  return (
    <svg viewBox="-10 0 220 152" preserveAspectRatio="xMidYMid meet" className="h-full w-full">
      <path d={arc(min, max)} fill="none" stroke="#eaf0f7" strokeWidth={17} />
      {segments.map((s) => (
        <path key={s.from} d={arc(s.from, s.to)} fill="none" stroke={s.color} strokeWidth={13} />
      ))}
      {ticks.map((v) => {
        const [x, y] = pt(v, R + 15);
        return (
          <text key={v} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize={9} fill="#475b73">
            {v}
          </text>
        );
      })}
      {needle && tip && (
        <>
          <line x1={cx} y1={cy} x2={tip[0]} y2={tip[1]} stroke="#e8a317" strokeWidth={5} strokeLinecap="round" />
          <circle cx={cx} cy={cy} r={9} fill="#0b2a5b" />
          <circle cx={cx} cy={cy} r={3.5} fill="#ffffff" />
        </>
      )}
      {!needle && mark && <circle cx={mark[0]} cy={mark[1]} r={8} fill="#fff" stroke="#0b2a5b" strokeWidth={2.5} />}
      {children}
    </svg>
  );
}
