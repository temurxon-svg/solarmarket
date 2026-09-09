export function PriceHistory({ points, locale }: { points: { d: string; v: number }[]; locale: string }) {
  if (points.length < 2) return null;
  const W = 560, H = 140, P = 28;
  const vs = points.map((p) => p.v); const min = Math.min(...vs), max = Math.max(...vs) || 1;
  const x = (i: number) => P + (i * (W - 2 * P)) / (points.length - 1);
  const y = (v: number) => H - P - ((v - min) / (max - min || 1)) * (H - 2 * P);
  const d = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join(" ");
  const fmt = (n: number) => new Intl.NumberFormat(locale === "en" ? "en-US" : "ru-RU", { maximumFractionDigits: 0 }).format(n);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-xl" role="img">
      <line x1={P} x2={W - P} y1={H - P} y2={H - P} stroke="#d9dee6" />
      <path d={d} fill="none" stroke="#e79a00" strokeWidth="2" />
      {points.map((p, i) => <circle key={i} cx={x(i)} cy={y(p.v)} r="2.5" fill="#e79a00" />)}
      <text x={P} y={12} fontSize="11" fill="#5b6472">{fmt(max)} UZS</text>
      <text x={P} y={H - 4} fontSize="11" fill="#5b6472">{points[0].d}</text>
      <text x={W - P} y={H - 4} fontSize="11" fill="#5b6472" textAnchor="end">{points[points.length - 1].d}</text>
      <text x={W - P} y={12} fontSize="11" fill="#5b6472" textAnchor="end">{fmt(min)} UZS</text>
    </svg>
  );
}
