"use client";

import { useEffect, useMemo, useState } from "react";
import type { Metric, MetricKey, NutritionTargets, WorkoutPlan } from "@/lib/types";
import { addMetric, bootstrap, getNutritionTargets, listMetrics, listPlans, todayISO } from "@/lib/store";
import {
  consistency,
  LOWER_IS_BETTER,
  macroSplit,
  metricStats,
  patternBalance,
  readinessSeries,
  sessionTypeSegments,
  volumeBars,
  type MetricStat,
} from "@/lib/analytics";
import { Donut, Legend } from "@/components/charts/Donut";
import { Bars } from "@/components/charts/Bars";
import { LineChart } from "@/components/charts/LineChart";
import { Radar } from "@/components/charts/Radar";
import { StatTile } from "@/components/dashboard/StatTile";
import { Reveal } from "@/components/Reveal";

type MetricDef = { key: MetricKey; label: string; unit: string };
const METRICS: MetricDef[] = [
  { key: "max_pullups", label: "Max pull-ups", unit: "reps" },
  { key: "max_pushups", label: "Max push-ups", unit: "reps" },
  { key: "vertical_cm", label: "Vertical jump", unit: "cm" },
  { key: "broad_jump_cm", label: "Broad jump", unit: "cm" },
  { key: "sprint20m_s", label: "20 m sprint", unit: "s" },
  { key: "plank_s", label: "Plank hold", unit: "s" },
  { key: "hang_s", label: "Dead hang", unit: "s" },
  { key: "bodyweight_kg", label: "Bodyweight", unit: "kg" },
];
const LABEL = new Map(METRICS.map((m) => [m.key, m]));

function Card({ title, children, sub }: { title: string; children: React.ReactNode; sub?: string }) {
  return (
    <div className="card p-5">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="font-bold">{title}</h3>
        {sub && <span className="text-xs text-muted">{sub}</span>}
      </div>
      {children}
    </div>
  );
}

export default function AnalyticsPage() {
  const [ready, setReady] = useState(false);
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [nutrition, setNutrition] = useState<NutritionTargets | null>(null);
  const [key, setKey] = useState<MetricKey>("max_pullups");
  const [value, setValue] = useState("");

  useEffect(() => {
    bootstrap();
    setPlans(listPlans(60));
    setMetrics(listMetrics());
    setNutrition(getNutritionTargets());
    setReady(true);
  }, []);

  const cons = useMemo(() => consistency(plans, todayISO()), [plans]);
  const stats = useMemo(() => metricStats(metrics), [metrics]);
  const sessionSegs = useMemo(() => sessionTypeSegments(plans), [plans]);
  const balance = useMemo(() => patternBalance(plans), [plans]);
  const readiness = useMemo(() => readinessSeries(plans), [plans]);
  const volume = useMemo(() => volumeBars(plans), [plans]);

  if (!ready || !nutrition) {
    return <div className="mt-8 h-72 animate-pulse rounded-3xl bg-surface-2" />;
  }

  const hasSessions = plans.length > 0;

  return (
    <div className="space-y-8">
      <header className="pt-2">
        <p className="kicker">The lab</p>
        <h1 className="display mt-1 text-5xl">Analytics</h1>
        <p className="mt-2 text-sm text-muted">Every number that says whether you&apos;re getting faster, stronger, and more explosive.</p>
      </header>

      <Reveal>
        <div className="grid grid-cols-2 gap-x-5 gap-y-6 sm:grid-cols-4">
          <StatTile label="Sessions" value={cons.planned} hint="last 30 days" accent />
          <StatTile label="Consistency" value={Math.round(cons.doneRate * 100)} suffix="%" hint={`${cons.done}/${cons.planned} done`} />
          <StatTile label="Streak" value={cons.streak} suffix="🔥" hint="in a row" />
          <StatTile label="Frequency" value={String(cons.perWeek)} suffix="/wk" hint="done per week" />
        </div>
      </Reveal>

      <div className="grid gap-5 lg:grid-cols-2">
        <Reveal>
          <Card title="Readiness trend" sub="last 14 sessions">
            {readiness.length >= 2 ? (
              <LineChart data={readiness} color="var(--strawberry)" unit="%" />
            ) : (
              <Empty />
            )}
          </Card>
        </Reveal>

        <Reveal delay={0.05}>
          <Card title="Session mix" sub={`${plans.length} sessions`}>
            {hasSessions ? (
              <div className="flex items-center gap-5">
                <Donut data={sessionSegs} centerValue={String(plans.length)} centerLabel="total" />
                <div className="flex-1"><Legend data={sessionSegs} /></div>
              </div>
            ) : (
              <Empty />
            )}
          </Card>
        </Reveal>

        <Reveal delay={0.1}>
          <Card title="Movement balance" sub="by prescribed sets">
            {hasSessions ? (
              <div className="flex justify-center">
                <Radar data={balance} />
              </div>
            ) : (
              <Empty />
            )}
          </Card>
        </Reveal>

        <Reveal delay={0.15}>
          <Card title="Fuel split" sub={nutrition.placeholder ? "placeholder" : "personalized"}>
            <div className="flex items-center gap-5">
              <Donut data={macroSplit(nutrition)} centerValue={nutrition.kcal.toLocaleString()} centerLabel="kcal" />
              <div className="flex-1"><Legend data={macroSplit(nutrition)} /></div>
            </div>
          </Card>
        </Reveal>

        <Reveal delay={0.2}>
          <Card title="Weekly volume" sub="total sets · last 7">
            {volume.length > 0 ? <Bars data={volume} /> : <Empty />}
          </Card>
        </Reveal>
      </div>

      {/* Performance metrics */}
      <section>
        <h2 className="display text-3xl">Performance</h2>
        <p className="mt-1 text-sm text-muted">Log a test whenever you hit one. Best = your PR.</p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const n = Number(value);
            if (!value || Number.isNaN(n)) return;
            addMetric(todayISO(), key, n);
            setMetrics(listMetrics());
            setValue("");
          }}
          className="card mt-4 space-y-3 p-4"
        >
          <select className="field" value={key} onChange={(e) => setKey(e.target.value as MetricKey)}>
            {METRICS.map((m) => (
              <option key={m.key} value={m.key}>
                {m.label} ({m.unit})
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <input type="number" inputMode="decimal" step="any" className="field" value={value} onChange={(e) => setValue(e.target.value)} placeholder={`Value in ${LABEL.get(key)!.unit}`} />
            <button type="submit" className="btn btn-primary whitespace-nowrap">Log it</button>
          </div>
        </form>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {stats.map((s, i) => (
            <Reveal key={s.key} delay={i * 0.04}>
              <MetricCard stat={s} def={LABEL.get(s.key)!} />
            </Reveal>
          ))}
          {stats.length === 0 && <p className="text-sm text-muted">No entries yet — log your first test above.</p>}
        </div>
      </section>
    </div>
  );
}

function MetricCard({ stat, def }: { stat: MetricStat; def: MetricDef }) {
  const lowerBetter = LOWER_IS_BETTER.includes(stat.key);
  const improved = lowerBetter ? stat.deltaTotal < 0 : stat.deltaTotal > 0;
  const flat = stat.deltaTotal === 0 || stat.count < 2;
  const color = flat ? "var(--muted)" : improved ? "var(--matcha)" : "var(--strawberry)";

  return (
    <div className="card p-4">
      <div className="flex items-baseline justify-between">
        <span className="font-bold">{def.label}</span>
        <span className="font-mono text-lg font-bold text-strawberry tabular-nums">
          {stat.latest}
          <span className="ml-1 text-xs text-muted">{def.unit}</span>
        </span>
      </div>

      <div className="mt-2">
        {stat.series.length >= 2 ? (
          <LineChart data={stat.series} color={color} unit={def.unit} height={90} />
        ) : (
          <p className="py-3 text-xs text-muted">One entry so far — log again to see the trend.</p>
        )}
      </div>

      <div className="mt-2 grid grid-cols-3 gap-2 border-t border-line pt-2 text-center">
        <Stat label="PR" value={`${stat.best}`} />
        <Stat label="since start" value={`${flat ? "—" : `${stat.deltaTotal > 0 ? "+" : ""}${stat.deltaTotal}`}`} color={flat ? undefined : color} />
        <Stat label="per week" value={`${stat.perWeek > 0 ? "+" : ""}${stat.perWeek}`} color={flat ? undefined : color} />
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <p className="font-mono text-sm font-bold tabular-nums" style={{ color: color ?? "var(--ink)" }}>{value}</p>
      <p className="text-[0.65rem] text-muted">{label}</p>
    </div>
  );
}

function Empty() {
  return <p className="py-10 text-center text-sm text-muted">Log a few sessions to unlock this.</p>;
}
