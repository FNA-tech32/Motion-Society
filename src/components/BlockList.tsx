import type { SessionBlock } from "@/lib/types";
import { Reveal } from "./Reveal";

function fmtRest(sec: number): string {
  if (sec <= 0) return "flow";
  if (sec >= 60) return `${Math.round(sec / 60)}m rest`;
  return `${sec}s rest`;
}

export function BlockList({ blocks }: { blocks: SessionBlock[] }) {
  return (
    <div className="mt-5 space-y-4">
      {blocks.map((block, i) => (
        <Reveal key={block.label} delay={0.1 + i * 0.06}>
          <section className="card overflow-hidden">
            <header className="flex items-baseline justify-between gap-3 border-b border-[var(--line)] px-4 py-3">
              <h3 className="font-semibold tracking-tight">{block.label}</h3>
              <span className="chip">{block.exercises.length} moves</span>
            </header>
            <p className="px-4 pt-3 text-sm text-muted">{block.intent}</p>
            <ul className="divide-y divide-[var(--line)] px-4">
              {block.exercises.map((ex, j) => (
                <li key={`${ex.exerciseId}-${j}`} className="py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-medium">{ex.name}</span>
                    <span className="whitespace-nowrap font-mono text-sm text-strawberry">
                      {ex.sets} × {ex.reps}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                    {ex.tempo && <span>{ex.tempo}</span>}
                    <span>{fmtRest(ex.restSec)}</span>
                  </div>
                  {ex.cues.length > 0 && (
                    <p className="mt-1.5 text-xs text-muted">
                      <span className="text-ink">Cues: </span>
                      {ex.cues.join(" · ")}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted">
                    <span className="font-semibold text-matcha">Easier: </span>
                    {ex.regression}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </Reveal>
      ))}
    </div>
  );
}
