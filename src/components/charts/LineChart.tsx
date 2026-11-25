export type Point = { label: string; value: number };

type Props = {
  data: Point[];
  color?: string;
  unit?: string;
  height?: number;
};

const W = 320;
const H = 120;
const PAD = 10;

/** Area + line chart over an ordered series. Pure SVG, uniform-scaled so geometry stays crisp. */
export function LineChart({ data, color = "var(--strawberry)", unit = "", height = 150 }: Props) {
  if (data.length < 2) {
    return <p className="py-8 text-center text-sm text-muted">Not enough data yet.</p>;
  }

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;

  const x = (i: number) => PAD + (i / (data.length - 1)) * (W - 2 * PAD);
  const y = (v: number) => H - PAD - ((v - min) / span) * (H - 2 * PAD);

  const line = data.map((d, i) => `${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join(" ");
  const area = `M ${x(0)},${H - PAD} L ${line.replace(/ /g, " L ")} L ${x(data.length - 1)},${H - PAD} Z`;
  const last = data[data.length - 1];

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={height} preserveAspectRatio="xMidYMid meet">
        {[0.25, 0.5, 0.75].map((g) => (
          <line key={g} x1={PAD} x2={W - PAD} y1={PAD + g * (H - 2 * PAD)} y2={PAD + g * (H - 2 * PAD)} stroke="var(--line)" strokeWidth={1} strokeDasharray="2 4" />
        ))}
        <polygon points={area.replace(/[MLZ]/g, "").trim()} fill={color} opacity={0.12} />
        <polyline points={line} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={x(data.length - 1)} cy={y(last.value)} r={4} fill={color} />
      </svg>
      <div className="mt-1 flex justify-between text-[0.65rem] text-muted">
        <span>{data[0].label}</span>
        <span className="font-mono font-bold text-ink">
          {last.value}
          {unit}
        </span>
        <span>{last.label}</span>
      </div>
    </div>
  );
}
