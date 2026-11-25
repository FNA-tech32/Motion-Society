export type Segment = { label: string; value: number; color: string };

type Props = {
  data: Segment[];
  size?: number;
  thickness?: number;
  centerValue?: string;
  centerLabel?: string;
};

/** Donut/pie chart in pure SVG. Segments are drawn as rotated dashed arcs. */
export function Donut({ data, size = 150, thickness = 18, centerValue, centerLabel }: Props) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let acc = 0;

  return (
    <svg width={size} height={size} role="img" aria-label={centerLabel ?? "chart"}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={thickness} />
      {data.map((d, i) => {
        const frac = d.value / total;
        const el = (
          <circle
            key={d.label + i}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={d.color}
            strokeWidth={thickness}
            strokeDasharray={`${Math.max(0, frac * c - 1.5)} ${c}`}
            transform={`rotate(${acc * 360 - 90} ${size / 2} ${size / 2})`}
          />
        );
        acc += frac;
        return el;
      })}
      {centerValue !== undefined && (
        <text x="50%" y="48%" textAnchor="middle" dominantBaseline="middle" className="display" style={{ fontSize: size * 0.2, fill: "var(--ink)" }}>
          {centerValue}
        </text>
      )}
      {centerLabel && (
        <text x="50%" y="63%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: size * 0.08, fill: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700 }}>
          {centerLabel}
        </text>
      )}
    </svg>
  );
}

export function Legend({ data }: { data: Segment[] }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  return (
    <ul className="space-y-1.5">
      {data.map((d) => (
        <li key={d.label} className="flex items-center gap-2 text-sm">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: d.color }} />
          <span className="flex-1 truncate text-muted">{d.label}</span>
          <span className="font-mono font-bold tabular-nums">{Math.round((d.value / total) * 100)}%</span>
        </li>
      ))}
    </ul>
  );
}
