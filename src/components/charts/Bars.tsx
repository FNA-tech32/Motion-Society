export type Bar = { label: string; value: number; color?: string; sub?: string };

/** Simple vertical bar chart. Heights are CSS-relative to the tallest bar. */
export function Bars({ data, height = 150, unit = "" }: { data: Bar[]; height?: number; unit?: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div>
      <div className="flex items-end gap-2" style={{ height }}>
        {data.map((d) => (
          <div
            key={d.label}
            title={`${d.label}: ${d.value}${unit}`}
            className="flex-1 rounded-t-lg transition-all"
            style={{
              height: `${(d.value / max) * 100}%`,
              minHeight: d.value > 0 ? 6 : 2,
              backgroundColor: d.color ?? "var(--strawberry)",
            }}
          />
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        {data.map((d) => (
          <div key={d.label} className="min-w-0 flex-1 text-center">
            <p className="font-mono text-xs font-bold tabular-nums">
              {d.value}
              {unit}
            </p>
            <p className="truncate text-[0.65rem] text-muted">{d.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
