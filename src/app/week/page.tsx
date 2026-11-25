"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { WorkoutPlan } from "@/lib/types";
import { listPlans } from "@/lib/store";
import { Reveal } from "@/components/Reveal";

const TYPE_COLOR: Record<WorkoutPlan["sessionType"], string> = {
  POWER: "var(--strawberry)",
  STRENGTH: "var(--matcha)",
  CONDITIONING: "var(--peach)",
  MOBILITY: "var(--blueberry)",
  REST: "var(--line)",
};

function shortDate(dateISO: string): string {
  return new Date(`${dateISO}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
  });
}

export default function WeekPage() {
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setPlans(listPlans(14));
    setReady(true);
  }, []);

  if (!ready) {
    return <div className="mt-10 h-64 animate-pulse rounded-2xl bg-[var(--surface-2)]" />;
  }

  return (
    <div className="mt-2">
      <p className="eyebrow">history</p>
      <h1 className="display mt-1 text-4xl">Your week</h1>
      <p className="mt-2 text-sm text-muted">Every session you&apos;ve built, most recent first.</p>

      {plans.length === 0 ? (
        <div className="card mt-6 p-6 text-center">
          <p className="text-sm text-muted">No sessions yet.</p>
          <Link href="/checkin" className="btn btn-primary mt-4 w-full">
            Check in for today
          </Link>
        </div>
      ) : (
        <div className="mt-5 space-y-2.5">
          {plans.map((plan, i) => (
            <Reveal key={plan.dateISO} delay={i * 0.04}>
              <div className="card flex items-center gap-4 px-4 py-3">
                <span
                  className="h-10 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: TYPE_COLOR[plan.sessionType] }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-semibold">{plan.title}</span>
                    <span className="text-xs text-muted">{shortDate(plan.dateISO)}</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--surface-2)]">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.round(plan.targets.readiness * 100)}%`,
                          backgroundColor: TYPE_COLOR[plan.sessionType],
                        }}
                      />
                    </div>
                    <span className="w-8 text-right font-mono text-xs text-muted">
                      {Math.round(plan.targets.readiness * 100)}
                    </span>
                  </div>
                </div>
                {plan.status !== "planned" && (
                  <span className={`chip ${plan.status === "done" ? "chip-matcha" : ""}`}>
                    {plan.status === "done" ? "✓" : "skip"}
                  </span>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
