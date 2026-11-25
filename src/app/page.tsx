"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Checkin, NutritionTargets, Profile, WorkoutPlan } from "@/lib/types";
import {
  bootstrap,
  defaultCheckin,
  getNutritionTargets,
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
import { CommandBar } from "@/components/agent/CommandBar";
import { StatTile } from "@/components/dashboard/StatTile";
import { SessionCard } from "@/components/SessionCard";
import { Reveal } from "@/components/Reveal";
import { patternBalance, sessionTypeSegments } from "@/lib/analytics";
import { Radar } from "@/components/charts/Radar";
import { Donut, Legend } from "@/components/charts/Donut";

function streakFrom(plans: WorkoutPlan[]): number {
  let streak = 0;
  for (const p of plans) {
    if (p.status === "done") streak++;
    else break;
  }
  return streak;
}

export default function OverviewPage() {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [checkin, setCheckin] = useState<Checkin | null>(null);
  const [checkedIn, setCheckedIn] = useState(false);
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [streak, setStreak] = useState(0);
  const [nutrition, setNutrition] = useState<NutritionTargets | null>(null);
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);

  const build = useCallback((p: Profile, c: Checkin, date: string, force = false) => {
    let next = force ? null : loadPlan(date);
    if (!next) {
      next = generatePlan(
        { dateISO: date, profile: p, checkin: c, events: loadEvents(date) },
        new Date().toISOString(),
      );
      savePlan(next);
    }
    setPlan(next);
  }, []);

  useEffect(() => {
    bootstrap();
    const date = todayISO();
    const p = loadProfile();
    const saved = loadCheckin(date);
    const c = saved ?? defaultCheckin(date);
    setProfile(p);
    setCheckin(c);
    setCheckedIn(Boolean(saved));
    if (p) build(p, c, date);
    const allPlans = listPlans(60);
    setPlans(allPlans);
    setStreak(streakFrom(allPlans));
    setNutrition(getNutritionTargets());
    setReady(true);
  }, [build]);

  if (!ready || !profile || !plan || !checkin || !nutrition) {
    return <div className="mt-8 h-72 animate-pulse rounded-3xl bg-surface-2" />;
  }

  const date = plan.dateISO;

  return (
    <div className="space-y-8">
      <header className="pt-2">
        <p className="kicker">Your training & fuel</p>
        <h1 className="display mt-1 text-5xl sm:text-6xl">Overview</h1>
      </header>

      <Reveal>
        <CommandBar />
      </Reveal>

      <Reveal delay={0.05}>
        <div className="grid grid-cols-2 gap-x-5 gap-y-6 sm:grid-cols-3 lg:grid-cols-5">
          <StatTile label="Readiness" value={Math.round(plan.targets.readiness * 100)} accent hint="energy · sleep · soreness" />
          <StatTile label="Today" value={plan.sessionType.toLowerCase()} hint={plan.title} />
          <StatTile label="Streak" value={streak} suffix="🔥" hint="sessions in a row" />
          <StatTile label="Calories" value={nutrition.kcal} hint={nutrition.placeholder ? "placeholder target" : "target"} />
          <StatTile label="Protein" value={nutrition.protein} suffix="g" hint={nutrition.placeholder ? "placeholder" : "target"} />
        </div>
      </Reveal>

      {!checkedIn && (
        <Reveal delay={0.08}>
          <Link
            href="/training"
            className="card bouncy flex items-center justify-between px-5 py-3 text-sm"
          >
            <span className="text-muted">
              This is a default plan — <span className="font-bold text-ink">check in</span> so I can tune today to how you feel.
            </span>
            <span className="text-strawberry">→</span>
          </Link>
        </Reveal>
      )}

      <Reveal delay={0.1}>
        <SessionCard
          plan={plan}
          onDone={() => {
            setPlanStatus(date, "done");
            setPlan({ ...plan, status: "done" });
            setStreak(streakFrom(listPlans(30)));
          }}
          onSkip={() => {
            setPlanStatus(date, "skipped");
            setPlan({ ...plan, status: "skipped" });
          }}
          onRegenerate={() => build(profile, checkin, date, true)}
        />
      </Reveal>

      <div className="grid gap-5 md:grid-cols-2">
        <Reveal delay={0.12}>
          <FuelCard nutrition={nutrition} />
        </Reveal>
        <Reveal delay={0.14}>
          <Link href="/training" className="card bouncy flex h-full flex-col justify-between p-5">
            <div>
              <p className="kicker text-matcha">Full session</p>
              <p className="mt-2 text-lg font-bold">See every block, set & cue</p>
              <p className="mt-1 text-sm text-muted">Warm-up → main work → cool-down, with easier options for each move.</p>
            </div>
            <span className="mt-4 font-bold text-strawberry">Open training →</span>
          </Link>
        </Reveal>
      </div>

      {plans.length > 0 && (
        <Reveal delay={0.16}>
          <section className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="kicker text-matcha">Snapshot</p>
                <h2 className="display mt-1 text-2xl">Movement balance</h2>
              </div>
              <Link href="/progress" className="text-sm font-bold text-strawberry">
                Full analytics →
              </Link>
            </div>
            <div className="mt-3 grid items-center gap-6 sm:grid-cols-2">
              <div className="flex justify-center">
                <Radar data={patternBalance(plans)} />
              </div>
              <div>
                <p className="mb-2 text-sm text-muted">Session mix</p>
                <div className="flex items-center gap-4">
                  <Donut data={sessionTypeSegments(plans)} size={110} centerValue={String(plans.length)} centerLabel="logged" />
                  <div className="flex-1">
                    <Legend data={sessionTypeSegments(plans)} />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </Reveal>
      )}
    </div>
  );
}

function FuelCard({ nutrition }: { nutrition: NutritionTargets }) {
  const macros = [
    { label: "Protein", value: nutrition.protein, unit: "g", color: "var(--strawberry)" },
    { label: "Carbs", value: nutrition.carbs, unit: "g", color: "var(--peach)" },
    { label: "Fat", value: nutrition.fat, unit: "g", color: "var(--matcha)" },
  ];
  return (
    <Link href="/nutrition" className="card bouncy block h-full p-5">
      <div className="flex items-center justify-between">
        <p className="kicker text-strawberry">Fuel</p>
        {nutrition.placeholder && <span className="chip">placeholder</span>}
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="display text-4xl">{nutrition.kcal.toLocaleString()}</span>
        <span className="kicker">kcal / day</span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {macros.map((m) => (
          <div key={m.label}>
            <div className="h-1.5 w-full rounded-full" style={{ backgroundColor: m.color }} />
            <p className="mt-1.5 text-sm font-bold">
              {m.value}
              {m.unit}
            </p>
            <p className="text-xs text-muted">{m.label}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-muted">
        Placeholder numbers — the AI will personalize your fuel from real research. Open Nutrition →
      </p>
    </Link>
  );
}
