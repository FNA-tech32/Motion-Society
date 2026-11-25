"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Checkin, PlanAddon, Profile, WorkoutPlan } from "@/lib/types";
import {
  bootstrap,
  defaultCheckin,
  deleteAddon,
  listAddons,
  listPlans,
  loadCheckin,
  loadEvents,
  loadPlan,
  loadProfile,
  savePlan,
  setPlanStatus,
  todayISO,
} from "@/lib/store";
import { generatePlan } from "@/lib/engine";
import { SessionCard } from "@/components/SessionCard";
import { BlockList } from "@/components/BlockList";
import { AddonList } from "@/components/AddonList";
import { Disclaimer } from "@/components/Disclaimer";
import { Reveal } from "@/components/Reveal";

const TYPE_COLOR: Record<WorkoutPlan["sessionType"], string> = {
  POWER: "var(--strawberry)",
  STRENGTH: "var(--matcha)",
  CONDITIONING: "var(--peach)",
  MOBILITY: "var(--blueberry)",
  REST: "var(--line)",
};

function shortDate(dateISO: string): string {
  return new Date(`${dateISO}T00:00:00`).toLocaleDateString(undefined, { weekday: "short", day: "numeric" });
}

export default function TrainingPage() {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [checkin, setCheckin] = useState<Checkin | null>(null);
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [addons, setAddons] = useState<PlanAddon[]>([]);
  const [history, setHistory] = useState<WorkoutPlan[]>([]);

  const build = useCallback((p: Profile, c: Checkin, date: string, force = false) => {
    let next = force ? null : loadPlan(date);
    if (!next) {
      next = generatePlan({ dateISO: date, profile: p, checkin: c, events: loadEvents(date) }, new Date().toISOString());
      savePlan(next);
    }
    setPlan(next);
  }, []);

  useEffect(() => {
    bootstrap();
    const date = todayISO();
    const p = loadProfile();
    const c = loadCheckin(date) ?? defaultCheckin(date);
    setProfile(p);
    setCheckin(c);
    if (p) build(p, c, date);
    setAddons(listAddons(date));
    setHistory(listPlans(10));
    setReady(true);
  }, [build]);

  if (!ready || !profile || !plan || !checkin) {
    return <div className="mt-8 h-72 animate-pulse rounded-3xl bg-surface-2" />;
  }

  const date = plan.dateISO;

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between pt-2">
        <div>
          <p className="kicker">Today&apos;s work</p>
          <h1 className="display mt-1 text-5xl">Training</h1>
        </div>
        <Link href="/checkin" className="btn btn-ghost text-sm">
          Tune today
        </Link>
      </header>

      <Reveal>
        <SessionCard
          plan={plan}
          onDone={() => {
            setPlanStatus(date, "done");
            setPlan({ ...plan, status: "done" });
            setHistory(listPlans(10));
          }}
          onSkip={() => {
            setPlanStatus(date, "skipped");
            setPlan({ ...plan, status: "skipped" });
          }}
          onRegenerate={() => build(profile, checkin, date, true)}
        />
      </Reveal>

      <BlockList blocks={plan.blocks} />

      <AddonList
        addons={addons}
        onDismiss={(id) => {
          deleteAddon(date, id);
          setAddons(listAddons(date));
        }}
      />

      <Disclaimer text={plan.disclaimer} />

      {history.length > 1 && (
        <section>
          <h2 className="display mt-4 text-2xl">Recent sessions</h2>
          <div className="mt-3 space-y-2.5">
            {history.map((p, i) => (
              <Reveal key={p.dateISO} delay={i * 0.03}>
                <div className="card flex items-center gap-4 px-4 py-3">
                  <span className="h-9 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: TYPE_COLOR[p.sessionType] }} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-bold">{p.title}</span>
                      <span className="text-xs text-muted">{shortDate(p.dateISO)}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
                      <div className="h-full rounded-full" style={{ width: `${Math.round(p.targets.readiness * 100)}%`, backgroundColor: TYPE_COLOR[p.sessionType] }} />
                    </div>
                  </div>
                  {p.status !== "planned" && (
                    <span className={`chip ${p.status === "done" ? "chip-matcha" : ""}`}>
                      {p.status === "done" ? "✓" : "skip"}
                    </span>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
