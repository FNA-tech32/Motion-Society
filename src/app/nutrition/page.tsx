"use client";

import { useEffect, useState } from "react";
import type { NutritionDay, NutritionTargets } from "@/lib/types";
import {
  addMeal,
  bootstrap,
  getNutritionDay,
  getNutritionTargets,
  removeMeal,
  setWater,
  todayISO,
} from "@/lib/store";
import { SAMPLE_MEALS, sumMacros } from "@/lib/nutrition";
import { Reveal } from "@/components/Reveal";
import { ResearchButton } from "@/components/agent/ResearchButton";

export default function NutritionPage() {
  const [ready, setReady] = useState(false);
  const [targets, setTargets] = useState<NutritionTargets | null>(null);
  const [day, setDay] = useState<NutritionDay | null>(null);
  const date = typeof window !== "undefined" ? todayISO() : "";

  const refresh = () => setDay(getNutritionDay(date));

  useEffect(() => {
    bootstrap();
    setTargets(getNutritionTargets());
    setDay(getNutritionDay(todayISO()));
    setReady(true);
  }, []);

  if (!ready || !targets || !day) {
    return <div className="mt-8 h-72 animate-pulse rounded-3xl bg-surface-2" />;
  }

  const eaten = sumMacros(day.meals);

  function planSampleDay() {
    for (const m of SAMPLE_MEALS) {
      addMeal(date, { name: m.name, slot: m.slot, kcal: m.kcal, protein: m.protein, carbs: m.carbs, fat: m.fat, planned: true });
    }
    refresh();
  }

  function addWater(ml: number) {
    setWater(date, day!.waterMl + ml);
    refresh();
  }

  return (
    <div className="space-y-6">
      <header className="pt-2">
        <p className="kicker">Fuel to perform</p>
        <h1 className="display mt-1 text-5xl">Nutrition</h1>
      </header>

      {targets.placeholder && (
        <div className="card border-l-4 border-strawberry px-4 py-4">
          <div className="flex items-start gap-3">
            <span className="text-lg">🍓</span>
            <p className="text-sm text-muted">
              These are <span className="font-bold text-ink">placeholder</span> fuel numbers for a
              growing athlete — not a diet. Let the AI research current sport-science and
              personalize your calories and macros to you.
            </p>
          </div>
          <ResearchButton focus="nutrition" label="🔬 Research my fuel" className="mt-3" />
        </div>
      )}

      <Reveal>
        <div className="card p-5">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            <Ring label="Calories" value={eaten.kcal} max={targets.kcal} unit="kcal" color="var(--strawberry)" big />
            <Ring label="Protein" value={eaten.protein} max={targets.protein} unit="g" color="var(--matcha)" />
            <Ring label="Carbs" value={eaten.carbs} max={targets.carbs} unit="g" color="var(--peach)" />
            <Ring label="Fat" value={eaten.fat} max={targets.fat} unit="g" color="var(--blueberry)" />
          </div>
        </div>
      </Reveal>

      <div className="grid gap-5 md:grid-cols-3">
        <div className="md:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="display text-2xl">Today&apos;s meals</h2>
            {day.meals.length === 0 && (
              <button type="button" onClick={planSampleDay} className="btn btn-matcha text-sm">
                Plan a sample day
              </button>
            )}
          </div>
          <div className="mt-3 space-y-2.5">
            {day.meals.map((m, i) => (
              <Reveal key={m.id} delay={i * 0.03}>
                <div className="card bouncy group flex items-center gap-3 px-4 py-3">
                  <span className="chip capitalize">{m.slot}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{m.name}</p>
                    <p className="text-xs text-muted">
                      {m.kcal} kcal · {m.protein}p / {m.carbs}c / {m.fat}f
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { removeMeal(date, m.id); refresh(); }}
                    className="shrink-0 text-muted opacity-0 transition-opacity hover:text-strawberry group-hover:opacity-100"
                    aria-label="Remove meal"
                  >
                    ✕
                  </button>
                </div>
              </Reveal>
            ))}
            {day.meals.length === 0 && (
              <p className="card px-4 py-6 text-center text-sm text-muted">
                No meals yet. Plan a sample day, or let the AI plan real meals once it&apos;s connected.
              </p>
            )}
          </div>
        </div>

        <div className="card h-fit p-5">
          <p className="kicker text-blueberry">Water</p>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="display text-4xl">{(day.waterMl / 1000).toFixed(1)}</span>
            <span className="kicker">/ {(targets.waterMl / 1000).toFixed(1)} L</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-blueberry transition-all"
              style={{ width: `${Math.min(100, (day.waterMl / targets.waterMl) * 100)}%` }}
            />
          </div>
          <div className="mt-4 flex gap-2">
            <button type="button" onClick={() => addWater(250)} className="btn btn-ghost flex-1 text-sm">
              +250ml
            </button>
            <button type="button" onClick={() => addWater(500)} className="btn btn-ghost flex-1 text-sm">
              +500ml
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Ring({
  label,
  value,
  max,
  unit,
  color,
  big,
}: {
  label: string;
  value: number;
  max: number;
  unit: string;
  color: string;
  big?: boolean;
}) {
  const size = big ? 104 : 92;
  const r = size / 2 - 8;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, max > 0 ? value / max : 0));
  return (
    <div className="flex flex-col items-center">
      <div className="relative grid place-items-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={7} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={7}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - pct)}
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute text-center leading-none">
          <span className="display text-lg">{Math.round(value)}</span>
          <span className="block text-[0.6rem] text-muted">/ {max}{unit}</span>
        </div>
      </div>
      <p className="mt-2 text-xs font-bold">{label}</p>
    </div>
  );
}
