import type { Profile, SessionType, Targets } from "@/lib/types";
import { tennisFirst } from "@/lib/defaults";
import type { DayFlags } from "./readDay";
import { dayIndex } from "./util";

/** Readiness thresholds (0..1). Below these we protect the athlete. */
const REST_MINUTES = 10;
const RECOVERY_READINESS = 0.3;
const EASY_READINESS = 0.45;
const FRESH_READINESS = 0.5;

/** Minutes cap per session type — the day's free time is clamped to this. */
const MINUTE_CAP: Record<SessionType, number> = {
  POWER: 45,
  STRENGTH: 50,
  CONDITIONING: 35,
  MOBILITY: 25,
  REST: 15,
};

/**
 * Tennis-first session selection. The order of checks is the safety policy:
 * match days and low readiness always win over "I want to lift".
 */
export function pickSessionType(
  flags: DayFlags,
  profile: Profile,
  dateISO: string,
): SessionType {
  // Match day: nothing that compromises the match or recovery around it.
  if (flags.tennis === "match") return "MOBILITY";

  // No real time, or running on empty → recover.
  if (flags.freeMinutes < REST_MINUTES) return "REST";
  if (flags.readiness < RECOVERY_READINESS) return "MOBILITY";

  // Practice day: complementary work only, kept light. Never redundant conditioning.
  if (flags.tennis === "practice") {
    return flags.readiness < EASY_READINESS ? "MOBILITY" : "STRENGTH";
  }

  // No tennis today.
  if (flags.readiness < FRESH_READINESS) return "STRENGTH";
  if (flags.freeMinutes < 20) return "STRENGTH"; // short window → skip full power warmup

  // Fresh with real time: bias explosive work (tennis speed/power), with a
  // strength day mixed in every third day for a balanced base. Deterministic.
  const strengthDay = dayIndex(dateISO) % 3 === 2;
  if (strengthDay && !tennisFirst(profile)) return "STRENGTH";
  return strengthDay ? "STRENGTH" : "POWER";
}

function focusFor(type: SessionType, flags: DayFlags): string[] {
  switch (type) {
    case "POWER":
      return ["explosive power", "first-step speed", "soft landings"];
    case "STRENGTH":
      return flags.tennis === "practice"
        ? ["upper + core", "tennis-transfer control"]
        : ["strength base", "single-leg + rotation"];
    case "CONDITIONING":
      return ["footwork", "change of direction", "work capacity"];
    case "MOBILITY":
      return ["recovery", "shoulder + wrist health", "easy movement"];
    case "REST":
      return ["rest", "light movement"];
  }
}

function intensityFor(type: SessionType, readiness: number): string {
  switch (type) {
    case "POWER":
      return "Full effort on each rep, full rest between — quality over quantity.";
    case "STRENGTH":
      return readiness >= 0.6
        ? "Leave 1–2 reps in the tank. Technique first, no grinding."
        : "Lighter day — clean, easy reps only.";
    case "CONDITIONING":
      return "Move well and keep the pace honest, but don't redline.";
    case "MOBILITY":
      return "Slow and easy. Nothing should hurt.";
    case "REST":
      return "Rest day. A walk or some easy movement is plenty.";
  }
}

export function buildTargets(
  type: SessionType,
  flags: DayFlags,
): Targets {
  const totalMinutes = Math.max(10, Math.min(MINUTE_CAP[type], flags.freeMinutes || MINUTE_CAP[type]));
  return {
    sessionType: type,
    readiness: flags.readiness,
    totalMinutes,
    intensityNote: intensityFor(type, flags.readiness),
    focus: focusFor(type, flags),
  };
}
