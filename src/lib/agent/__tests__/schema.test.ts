import { describe, expect, it } from "vitest";
import {
  ADDON_MAX_EXERCISES,
  ADDON_MAX_SETS,
  KCAL_FLOOR,
  sanitizeUpdates,
  type AgentUpdates,
} from "@/lib/agent/schema";

/**
 * The sanitizer is the trust boundary between a model that just watched a video
 * and a 15-year-old's actual training plan. Everything below is an attempt to get
 * something unsafe or malformed past it.
 */

/** Loosely typed on purpose: these are the shapes a model can actually emit. */
function exercise(over: Record<string, unknown> = {}) {
  return { name: "Scapular pull-up", sets: 3, reps: "8-10", cues: ["Slow"], regression: "Dead hang.", ...over };
}

function updates(workout: unknown): AgentUpdates {
  return { reply: "ok", workout } as AgentUpdates;
}

describe("sanitizeUpdates — nutrition floor", () => {
  it("raises a starvation-level kcal target to the floor", () => {
    const out = sanitizeUpdates({ reply: "cut time", nutrition: { kcal: 900 } });
    expect(out.nutrition?.kcal).toBe(KCAL_FLOOR);
  });

  it("leaves an adequate kcal target alone", () => {
    const out = sanitizeUpdates({ reply: "fuel up", nutrition: { kcal: 3200 } });
    expect(out.nutrition?.kcal).toBe(3200);
  });
});

describe("sanitizeUpdates — video workout addon", () => {
  it("keeps a well-formed block intact", () => {
    const out = sanitizeUpdates(updates({ title: "Pull work", intent: "Fix the scap.", exercises: [exercise()] }));
    expect(out.workout?.title).toBe("Pull work");
    expect(out.workout?.exercises).toHaveLength(1);
    expect(out.workout?.exercises[0].sets).toBe(3);
  });

  it("clamps set counts above the ceiling", () => {
    const out = sanitizeUpdates(updates({ title: "t", intent: "i", exercises: [exercise({ sets: 40 })] }));
    expect(out.workout?.exercises[0].sets).toBe(ADDON_MAX_SETS);
  });

  it("clamps set counts below one", () => {
    const out = sanitizeUpdates(updates({ title: "t", intent: "i", exercises: [exercise({ sets: 0 })] }));
    expect(out.workout?.exercises[0].sets).toBe(1);
  });

  it("substitutes a default for a non-numeric set count", () => {
    const out = sanitizeUpdates(updates({ title: "t", intent: "i", exercises: [exercise({ sets: "lots" })] }));
    expect(out.workout?.exercises[0].sets).toBe(2);
  });

  it("caps the number of exercises", () => {
    const many = Array.from({ length: 20 }, (_, i) => exercise({ name: `Move ${i}` }));
    const out = sanitizeUpdates(updates({ title: "t", intent: "i", exercises: many }));
    expect(out.workout?.exercises).toHaveLength(ADDON_MAX_EXERCISES);
  });

  it("always supplies a regression, even when the model omits one", () => {
    const out = sanitizeUpdates(updates({ title: "t", intent: "i", exercises: [exercise({ regression: "" })] }));
    expect(out.workout?.exercises[0].regression).toBeTruthy();
  });

  it("drops nameless exercises", () => {
    const out = sanitizeUpdates(
      updates({ title: "t", intent: "i", exercises: [exercise({ name: "  " }), exercise()] }),
    );
    expect(out.workout?.exercises).toHaveLength(1);
  });

  it("drops the whole block when nothing survives", () => {
    const out = sanitizeUpdates(updates({ title: "t", intent: "i", exercises: [exercise({ name: "" })] }));
    expect(out.workout).toBeUndefined();
  });

  it("keeps at most three cues", () => {
    const out = sanitizeUpdates(
      updates({ title: "t", intent: "i", exercises: [exercise({ cues: ["a", "b", "c", "d", "e"] })] }),
    );
    expect(out.workout?.exercises[0].cues).toHaveLength(3);
  });

  it("ignores a workout with no exercises array", () => {
    expect(sanitizeUpdates(updates({ title: "t", intent: "i" })).workout).toBeUndefined();
  });

  it("ignores a workout that is not an object", () => {
    expect(sanitizeUpdates(updates("give me 500 burpees")).workout).toBeUndefined();
  });

  it("omits the workout field entirely when absent — the normal agent path", () => {
    expect(sanitizeUpdates({ reply: "Logged it." }).workout).toBeUndefined();
  });
});
