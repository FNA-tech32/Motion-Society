export type Axis = { label: string; value: number }; // value 0..1

/** Radar / spider chart for balance across categories (e.g. movement patterns). */
export function Radar({ data, size = 230, color = "var(--matcha)" }: { data: Axis[]; size?: number; color?: string }) {
  const n = data.length;
  if (n < 3) return <p className="py-8 text-center text-sm text-muted">Not enough data yet.</p>;

  const cx = size / 2;
  const cy = size / 2;
  const R = size / 2 - 34;
  const angle = (i: number) => ((-90 + (i * 360) / n) * Math.PI) / 180;
  const point = (i: number, frac: number): [number, number] => [
    cx + R * frac * Math.cos(angle(i)),
    cy + R * frac * Math.sin(angle(i)),
  ];

  const rings = [0.25, 0.5, 0.75, 1];
  const dataPoly = data.map((d, i) => point(i, Math.max(0.02, Math.min(1, d.value))).join(",")).join(" ");

  return (
    <svg width={size} height={size} role="img" aria-label="balance chart">
      {rings.map((r) => (
        <polygon
          key={r}
          points={data.map((_, i) => point(i, r).join(",")).join(" ")}
          fill="none"
          stroke="var(--line)"
          strokeWidth={1}
        />
      ))}
      {data.map((_, i) => {
        const [px, py] = point(i, 1);
        return <line key={i} x1={cx} y1={cy} x2={px} y2={py} stroke="var(--line)" strokeWidth={1} />;
      })}
      <polygon points={dataPoly} fill={color} fillOpacity={0.22} stroke={color} strokeWidth={2} strokeLinejoin="round" />
      {data.map((d, i) => {
        const [lx, ly] = point(i, 1.16);
        return (
          <text
            key={d.label}
            x={lx}
            y={ly}
            textAnchor={lx < cx - 4 ? "end" : lx > cx + 4 ? "start" : "middle"}
            dominantBaseline="middle"
            style={{ fontSize: 10, fontWeight: 700, fill: "var(--muted)" }}
          >
            {d.label}
          </text>
        );
      })}
    </svg>
  );
}
