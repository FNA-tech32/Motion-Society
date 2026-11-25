"use client";

import { CountUp } from "@/components/CountUp";

type Props = {
  label: string;
  value: number | string;
  hint?: string;
  accent?: boolean;
  suffix?: string;
};

/** Magazine-style stat: a top rule, a small-caps label, an oversized number, a hint. */
export function StatTile({ label, value, hint, accent, suffix = "" }: Props) {
  return (
    <div className={`stat-rule ${accent ? "stat-rule-accent" : ""} pt-3`}>
      <p className="kicker">{label}</p>
      <div className="mt-1.5">
        {typeof value === "number" ? (
          <CountUp to={value} suffix={suffix} className="display text-4xl tabular-nums sm:text-5xl" />
        ) : (
          <span className="display text-3xl sm:text-4xl">
            {value}
            {suffix && <span className="text-2xl">{suffix}</span>}
          </span>
        )}
      </div>
      {hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}
