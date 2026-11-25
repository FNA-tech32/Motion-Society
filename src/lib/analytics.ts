import { findExercise } from "@/lib/exercises/library";
import type { Metric, MetricKey, NutritionTargets, SessionType, WorkoutPlan } from "@/lib/types";
import type { Segment } from "@/components/charts/Donut";
import type { Bar } from "@/components/charts/Bars";
import type { Point } from "@/components/charts/LineChart";
import type { Axis } from "@/components/charts/Radar";

export const SESSION_COLORS: Record<SessionType, string> = {
  POWER: "var(--strawberry)",
  STRENGTH: "var(--matcha)",
  CONDITIONING: "var(--peach)",
  MOBILITY: "var(--blueberry)",
  REST: "var(--line)",
};

function shortDay(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { month: "numeric", day: "numeric" });
}

function shiftDays(iso: string, days: number): string {
  const d = new Date(Date.parse(`${iso}T00:00:00.000Z`) + days * 86_400_000);
  return d.toISOString().slice(0, 10);
}

export function sessionTypeSegments(plans: WorkoutPlan[]): Segment[] {
  const counts = new Map<SessionType, number>();
  for (const p of plans) counts.set(p.sessionType, (counts.get(p.sessionType) ?? 0) + 1);
  return [...counts.entries()].map(([k, v]) => ({
    label: k.charAt(0) + k.slice(1).toLowerCase(),
    value: v,
    color: SESSION_COLORS[k],
  }));
}

const PATTERN_BUCKET: Record<string, string> = {
  push: "Push",
  pull: "Pull",
  squat: "Legs",
  hinge: "Legs",
  lunge: "Legs",
  core: "Core",
  rotation: "Rotation",
  plyo: "Speed",
  sprint: "Speed",
  mobility: "Mobility",
  shoulder_health: "Mobility",
  wrist_forearm: "Mobility",
  carry: "Carry",
};
const BUCKETS = ["Push", "Pull", "Legs", "Core", "Rotation", "Speed", "Mobility"];

/** Balance of trained movement patterns (weighted by prescribed sets), normalized 0..1. */
export function patternBalance(plans: WorkoutPlan[]): Axis[] {
  const counts: Record<string, number> = Object.fromEntries(BUCKETS.map((b) => [b, 0]));
  for (const p of plans) {
    for (const block of p.blocks) {
      for (const ex of block.exercises) {
        const e = findExercise(ex.exerciseId);
        if (!e) continue;
        const bucket = PATTERN_BUCKET[e.pattern];
        if (!bucket) continue;
        counts[bucket] += ex.sets;
      }
    }
  }
  const max = Math.max(1, ...BUCKETS.map((b) => counts[b]));
  return BUCKETS.map((b) => ({ label: b, value: counts[b] / max }));
}

export interface Consistency {
  doneRate: number;
  done: number;
  planned: number;
  streak: number;
  perWeek: number;
}

export function consistency(plans: WorkoutPlan[], todayISO: string): Consistency {
  const cutoff = shiftDays(todayISO, -30);
  const recent = plans.filter((p) => p.dateISO >= cutoff);
  const planned = recent.length;
  const done = recent.filter((p) => p.status === "done").length;
  const desc = [...plans].sort((a, b) => b.dateISO.localeCompare(a.dateISO));
  let streak = 0;
  for (const p of desc) {
    if (p.status === "done") streak++;
    else break;
  }
  return {
    doneRate: planned ? done / planned : 0,
    done,
    planned,
    streak,
    perWeek: Math.round((done / (30 / 7)) * 10) / 10,
  };
}

export function readinessSeries(plans: WorkoutPlan[]): Point[] {
  return [...plans]
    .sort((a, b) => a.dateISO.localeCompare(b.dateISO))
    .slice(-14)
    .map((p) => ({ label: shortDay(p.dateISO), value: Math.round(p.targets.readiness * 100) }));
}

export function volumeBars(plans: WorkoutPlan[]): Bar[] {
  return [...plans]
    .sort((a, b) => a.dateISO.localeCompare(b.dateISO))
    .slice(-7)
    .map((p) => {
      const sets = p.blocks.reduce((s, b) => s + b.exercises.reduce((x, e) => x + e.sets, 0), 0);
      return { label: shortDay(p.dateISO), value: sets, color: SESSION_COLORS[p.sessionType] };
    });
}

export function macroSplit(t: NutritionTargets): Segment[] {
  return [
    { label: `Protein · ${t.protein}g`, value: t.protein * 4, color: "var(--matcha)" },
    { label: `Carbs · ${t.carbs}g`, value: t.carbs * 4, color: "var(--peach)" },
    { label: `Fat · ${t.fat}g`, value: t.fat * 9, color: "var(--strawberry)" },
  ];
}

export interface MetricStat {
  key: MetricKey;
  latest: number;
  best: number;
  first: number;
  count: number;
  deltaTotal: number;
  perWeek: number;
  series: Point[];
}

/** lowerIsBetter keys use min as "best" and invert improvement direction. */
export const LOWER_IS_BETTER: MetricKey[] = ["sprint20m_s"];

export function metricStats(metrics: Metric[]): MetricStat[] {
  const byKey = new Map<MetricKey, Metric[]>();
  for (const m of metrics) {
    const list = byKey.get(m.key) ?? [];
    list.push(m);
    byKey.set(m.key, list);
  }
  const out: MetricStat[] = [];
  for (const [key, list] of byKey) {
    const sorted = [...list].sort((a, b) => a.dateISO.localeCompare(b.dateISO));
    const vals = sorted.map((x) => x.value);
    const first = vals[0];
    const latest = vals[vals.length - 1];
    const best = LOWER_IS_BETTER.includes(key) ? Math.min(...vals) : Math.max(...vals);
    const days = Math.max(
      1,
      (Date.parse(sorted[sorted.length - 1].dateISO) - Date.parse(sorted[0].dateISO)) / 86_400_000,
    );
    out.push({
      key,
      latest,
      best,
      first,
      count: vals.length,
      deltaTotal: Math.round((latest - first) * 100) / 100,
      perWeek: Math.round(((latest - first) / (days / 7)) * 100) / 100,
      series: sorted.map((x) => ({ label: shortDay(x.dateISO), value: x.value })),
    });
  }
  return out;
}
