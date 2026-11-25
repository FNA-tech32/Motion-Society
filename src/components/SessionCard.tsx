"use client";

import type { WorkoutPlan } from "@/lib/types";
import { Reveal } from "./Reveal";
import { ReadinessDial } from "./ReadinessDial";
import { CountUp } from "./CountUp";

type Props = {
  plan: WorkoutPlan;
  onDone: () => void;
  onSkip: () => void;
  onRegenerate: () => void;
};

function dateLabel(dateISO: string): string {
  const d = new Date(`${dateISO}T00:00:00`);
  return d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
}

const STATUS_STYLE: Record<WorkoutPlan["status"], string> = {
  planned: "",
  done: "chip-matcha",
  skipped: "",
};

export function SessionCard({ plan, onDone, onSkip, onRegenerate }: Props) {
  const done = plan.status === "done";
  const skipped = plan.status === "skipped";

  return (
    <Reveal>
      <article className="card-pop p-5">
        <div className="flex items-center justify-between">
          <span className="eyebrow">{dateLabel(plan.dateISO)}</span>
          <span className="chip chip-strawberry">{plan.sessionType.toLowerCase()}</span>
        </div>

        <h1 className="display mt-2 text-[2.6rem] sm:text-5xl">{plan.title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">{plan.why}</p>

        <div className="mt-5 flex items-center gap-5">
          <ReadinessDial value={plan.targets.readiness} />
          <div className="min-w-0">
            <div className="flex items-baseline gap-1.5">
              <CountUp to={plan.targets.totalMinutes} className="display text-4xl text-strawberry" />
              <span className="eyebrow">min</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {plan.targets.focus.map((f) => (
                <span key={f} className="chip">
                  {f}
                </span>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-4 text-xs italic text-muted">{plan.targets.intensityNote}</p>

        {(done || skipped) && (
          <div className="mt-4">
            <span className={`chip ${STATUS_STYLE[plan.status]}`}>
              {done ? "✓ logged as done" : "skipped"}
            </span>
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" className="btn btn-primary flex-1" onClick={onDone} disabled={done}>
            {done ? "Done" : "Mark done"}
          </button>
          <button type="button" className="btn btn-ghost" onClick={onSkip}>
            Skip
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onRegenerate}
            aria-label="Regenerate today's session"
          >
            ↻
          </button>
        </div>
      </article>
    </Reveal>
  );
}
