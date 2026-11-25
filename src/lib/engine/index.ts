import type { DayContext, SessionType, WorkoutPlan } from "@/lib/types";
import { DISCLAIMER } from "@/lib/defaults";
import { readDay, type DayFlags } from "./readDay";
import { pickSessionType, buildTargets } from "./targets";
import { buildBlocks } from "./session";

export { readDay, computeReadiness, type DayFlags } from "./readDay";
export { pickSessionType, buildTargets } from "./targets";
export { buildBlocks } from "./session";

const TITLES: Record<SessionType, string> = {
  POWER: "Power & Speed",
  STRENGTH: "Strength Base",
  CONDITIONING: "Footwork & Conditioning",
  MOBILITY: "Recovery & Mobility",
  REST: "Rest Day",
};

function pct(readiness: number): number {
  return Math.round(readiness * 100);
}

function buildWhy(type: SessionType, flags: DayFlags): string {
  if (flags.tennis === "match") {
    return "Match today — this is light activation and recovery so you show up fast and fresh. Save your legs for the court.";
  }
  if (flags.tennis === "practice") {
    return type === "MOBILITY"
      ? "Practice on the calendar and your battery's low — keep it to easy mobility and let the court be the workout."
      : "Tennis practice today, so this is complementary upper-body and core work that won't cook your legs for the court.";
  }
  // No tennis today.
  switch (type) {
    case "POWER":
      return `No tennis on the calendar and you're feeling fresh (readiness ${pct(flags.readiness)}%). Great day to train speed and explosiveness.`;
    case "STRENGTH":
      return flags.readiness < 0.5
        ? "No tennis today, but you're a little run-down — a steady strength day, nothing you'll regret tomorrow."
        : "Strength day in the rotation — building the base that makes your power days pay off.";
    case "MOBILITY":
      return "You're pretty depleted today, so this is easy mobility to help you bounce back for tomorrow.";
    case "REST":
      return "Short on time or in need of recovery — rest is training too. A walk or an easy stretch is perfect.";
    default:
      return "Today's session, matched to your schedule and how you're feeling.";
  }
}

/**
 * Turn a day's context into a full, youth-safe workout plan. Pure and
 * deterministic: same inputs → identical plan. `nowISO` stamps creation time
 * (passed in, never read from the clock) so callers stay in control.
 */
export function generatePlan(ctx: DayContext, nowISO?: string): WorkoutPlan {
  const flags = readDay(ctx);
  const sessionType = pickSessionType(flags, ctx.profile, ctx.dateISO);
  const targets = buildTargets(sessionType, flags);
  const blocks = buildBlocks(sessionType, ctx, flags, targets);

  return {
    dateISO: ctx.dateISO,
    sessionType,
    title: TITLES[sessionType],
    why: buildWhy(sessionType, flags),
    targets,
    blocks,
    disclaimer: DISCLAIMER,
    status: "planned",
    generatedBy: "deterministic",
    createdAtISO: nowISO ?? `${ctx.dateISO}T00:00:00.000Z`,
  };
}
