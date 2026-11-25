import { describe, expect, it } from "vitest";
import type {
  CalendarEvent,
  Checkin,
  DayContext,
  MovementPattern,
  SessionType,
} from "@/lib/types";
import { defaultProfile } from "@/lib/defaults";
import { findExercise } from "@/lib/exercises/library";
import { computeReadiness, generatePlan } from "@/lib/engine";

const PROFILE = defaultProfile("2020-01-01T00:00:00.000Z");
const LEG_PATTERNS: MovementPattern[] = ["squat", "hinge", "lunge", "plyo", "sprint"];

function checkin(over: Partial<Checkin> = {}): Checkin {
  return {
    dateISO: "2026-07-08",
    energy: 4,
    sleepQuality: 4,
    soreness: 1,
    soreAreas: [],
    minutesAvailable: 45,
    note: "",
    createdAtISO: "2026-07-08T07:00:00.000Z",
    ...over,
  };
}

function ctx(over: {
  dateISO?: string;
  checkin?: Partial<Checkin>;
  events?: CalendarEvent[];
} = {}): DayContext {
  const dateISO = over.dateISO ?? "2026-07-08";
  return {
    dateISO,
    profile: PROFILE,
    checkin: checkin({ ...over.checkin, dateISO }),
    events: over.events ?? [],
  };
}

function allPatterns(plan: ReturnType<typeof generatePlan>): MovementPattern[] {
  return plan.blocks.flatMap((b) =>
    b.exercises.map((p) => findExercise(p.exerciseId)!.pattern),
  );
}

/** Search the month for a date the engine classifies as `type` under fresh, no-tennis conditions. */
function findDateForType(type: SessionType, over: Partial<Checkin> = {}): string {
  for (let d = 1; d <= 28; d++) {
    const dateISO = `2026-07-${String(d).padStart(2, "0")}`;
    if (generatePlan(ctx({ dateISO, checkin: over })).sessionType === type) {
      return dateISO;
    }
  }
  throw new Error(`no ${type} date found`);
}

describe("computeReadiness", () => {
  it("is 1.0 when fully fresh", () => {
    expect(computeReadiness(checkin({ energy: 5, sleepQuality: 5, soreness: 0 }))).toBe(1);
  });
  it("is 0 when wiped out and maximally sore", () => {
    expect(computeReadiness(checkin({ energy: 1, sleepQuality: 1, soreness: 5 }))).toBe(0);
  });
  it("weights energy, sleep, and soreness together", () => {
    expect(computeReadiness(checkin({ energy: 3, sleepQuality: 3, soreness: 2 }))).toBe(0.53);
  });
});

describe("session selection — tennis-first safety", () => {
  it("match day → recovery only, no legs or power work", () => {
    const plan = generatePlan(
      ctx({ events: [{ title: "League match", kind: "tennis_match" }] }),
    );
    expect(plan.sessionType).toBe("MOBILITY");
    const patterns = allPatterns(plan);
    expect(patterns.some((p) => LEG_PATTERNS.includes(p))).toBe(false);
    expect(plan.blocks.some((b) => b.exercises.some((e) => findExercise(e.exerciseId)!.category === "power"))).toBe(false);
  });

  it("practice day (fresh) → complementary strength that spares the legs", () => {
    const plan = generatePlan(
      ctx({ events: [{ title: "Practice", kind: "tennis_practice" }] }),
    );
    expect(plan.sessionType).toBe("STRENGTH");
    expect(allPatterns(plan).some((p) => LEG_PATTERNS.includes(p))).toBe(false);
    expect(plan.blocks.some((b) => b.label === "Finisher")).toBe(false);
  });

  it("no time → REST", () => {
    const plan = generatePlan(ctx({ checkin: { minutesAvailable: 5 } }));
    expect(plan.sessionType).toBe("REST");
  });

  it("depleted → MOBILITY", () => {
    const plan = generatePlan(ctx({ checkin: { energy: 1, sleepQuality: 1, soreness: 5 } }));
    expect(plan.sessionType).toBe("MOBILITY");
  });
});

describe("power day", () => {
  it("fresh + no tennis produces an explosive session within the time cap", () => {
    const date = findDateForType("POWER");
    const plan = generatePlan(ctx({ dateISO: date }));
    expect(plan.sessionType).toBe("POWER");
    expect(plan.blocks.some((b) => b.label === "Power & speed")).toBe(true);
    expect(plan.targets.totalMinutes).toBeLessThanOrEqual(45);
  });

  it("sore legs shift power work toward non-leg movements", () => {
    const date = findDateForType("POWER", { soreness: 5, soreAreas: ["legs"] });
    const plan = generatePlan(ctx({ dateISO: date, checkin: { soreness: 5, soreAreas: ["legs"] } }));
    const powerBlock = plan.blocks.find((b) => b.label === "Power & speed")!;
    const ids = powerBlock.exercises.map((e) => e.exerciseId);
    // Highest-scoring non-leg power moves should be prioritised.
    expect(ids).toContain("pw-db-push-press");
    expect(ids).toContain("pw-rotational-jump");
  });
});

describe("plan invariants", () => {
  const scenarios: DayContext[] = [
    ctx(),
    ctx({ events: [{ title: "Match", kind: "tennis_match" }] }),
    ctx({ events: [{ title: "Practice", kind: "tennis_practice" }] }),
    ctx({ checkin: { minutesAvailable: 20, energy: 2 } }),
    ctx({ checkin: { soreness: 4, soreAreas: ["upper", "legs"] } }),
    ctx({ dateISO: findDateForType("STRENGTH") }),
  ];

  const CAP: Record<SessionType, number> = {
    POWER: 45,
    STRENGTH: 50,
    CONDITIONING: 35,
    MOBILITY: 25,
    REST: 15,
  };

  it("every prescribed exercise exists, is youth-safe, and has a regression", () => {
    for (const scenario of scenarios) {
      const plan = generatePlan(scenario);
      for (const block of plan.blocks) {
        expect(block.exercises.length).toBeGreaterThan(0);
        for (const p of block.exercises) {
          const ex = findExercise(p.exerciseId);
          expect(ex, `${p.exerciseId} in library`).toBeTruthy();
          expect(ex!.youthSafe).toBe(true);
          expect(p.regression.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("never exceeds the per-type minute cap and always carries the disclaimer", () => {
    for (const scenario of scenarios) {
      const plan = generatePlan(scenario);
      expect(plan.targets.totalMinutes).toBeLessThanOrEqual(CAP[plan.sessionType]);
      expect(plan.disclaimer.length).toBeGreaterThan(0);
    }
  });

  it("is fully deterministic for identical input", () => {
    const scenario = ctx({ dateISO: "2026-07-15" });
    expect(generatePlan(scenario)).toEqual(generatePlan(scenario));
  });
});
