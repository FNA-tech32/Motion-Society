"use client";

import type { PlanAddon } from "@/lib/types";
import { Reveal } from "./Reveal";

interface Props {
  addons: PlanAddon[];
  onDismiss: (id: string) => void;
}

/**
 * Video-derived blocks, rendered after the engine's blocks and visually distinct
 * from them — this work came from a clip he chose, not from the program.
 */
export function AddonList({ addons, onDismiss }: Props) {
  if (!addons.length) return null;

  return (
    <div className="mt-5 space-y-4">
      {addons.map((addon, i) => (
        <Reveal key={addon.id} delay={0.08 + i * 0.06}>
          <section className="card overflow-hidden border-l-4 border-blueberry">
            <header className="flex items-baseline justify-between gap-3 border-b border-[var(--line)] px-4 py-3">
              <h3 className="font-semibold tracking-tight">🎥 {addon.title}</h3>
              <button
                type="button"
                onClick={() => onDismiss(addon.id)}
                className="chip transition-transform hover:-translate-y-0.5"
                aria-label={`Dismiss ${addon.title}`}
              >
                dismiss
              </button>
            </header>

            <p className="px-4 pt-3 text-sm text-muted">{addon.intent}</p>

            <ul className="divide-y divide-[var(--line)] px-4">
              {addon.exercises.map((ex, j) => (
                <li key={`${addon.id}-${j}`} className="py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-medium">{ex.name}</span>
                    <span className="whitespace-nowrap font-mono text-sm text-strawberry">
                      {ex.sets} × {ex.reps}
                    </span>
                  </div>
                  {ex.why && <p className="mt-1 text-xs text-muted">{ex.why}</p>}
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

            <p className="truncate px-4 py-3 text-xs text-muted">
              from {addon.sourceKind === "link" ? "a link" : "your video"} · {addon.sourceLabel}
            </p>
          </section>
        </Reveal>
      ))}
    </div>
  );
}
