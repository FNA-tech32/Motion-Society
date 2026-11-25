import type {
  DayContext,
  Exercise,
  ExerciseCategory,
  MovementPattern,
  PrescribedExercise,
  SessionBlock,
  SessionType,
  SorenessArea,
  Targets,
} from "@/lib/types";
import { tennisFirst } from "@/lib/defaults";
import { exercisesFor } from "@/lib/exercises/library";
import type { DayFlags } from "./readDay";
import { rotate, seedFromString } from "./util";

// --- soreness → which body area a movement loads ---------------------------

function patternArea(pattern: MovementPattern): SorenessArea | null {
  switch (pattern) {
    case "squat":
    case "hinge":
    case "lunge":
    case "plyo":
    case "sprint":
      return "legs";
    case "push":
    case "pull":
    case "carry":
      return "upper";
    case "shoulder_health":
      return "shoulders";
    case "core":
    case "rotation":
      return "core";
    default:
      return null;
  }
}

function sorenessPenalty(ex: Exercise, flags: DayFlags): number {
  const area = patternArea(ex.pattern);
  if (!area || !flags.soreAreas.includes(area)) return 0;
  if (flags.soreness >= 4) return 6;
  if (flags.soreness >= 2) return 3;
  return 1;
}

function scoreExercise(ex: Exercise, flags: DayFlags, ctx: DayContext): number {
  let s = 10;
  if (ex.tennisTransfer && tennisFirst(ctx.profile)) s += 3;
  s -= sorenessPenalty(ex, flags);
  return s;
}

interface PoolOpts {
  category?: ExerciseCategory;
  patterns?: MovementPattern[];
}

function pool(ctx: DayContext, opts: PoolOpts): Exercise[] {
  return exercisesFor(ctx.profile.equipment, (e) => {
    if (opts.category && e.category !== opts.category) return false;
    if (opts.patterns && !opts.patterns.includes(e.pattern)) return false;
    return true;
  });
}

/**
 * Deterministic selection: rank by score, rotate by a per-day/per-block seed
 * for variety, then take `count` while keeping pattern diversity.
 */
function pick(
  candidates: Exercise[],
  count: number,
  seedKey: string,
  ctx: DayContext,
  flags: DayFlags,
  exclude: Set<string> = new Set(),
): Exercise[] {
  const ranked = candidates
    .filter((e) => !exclude.has(e.id))
    .map((e) => ({ e, s: scoreExercise(e, flags, ctx) }))
    .sort((a, b) => b.s - a.s || a.e.id.localeCompare(b.e.id));

  // Rotate only WITHIN equal-score tiers: score (e.g. soreness avoidance) always
  // wins; the per-day seed only varies the order among genuinely equal options.
  const seed = seedFromString(seedKey);
  const ordered: Exercise[] = [];
  for (let i = 0; i < ranked.length; ) {
    let j = i;
    while (j < ranked.length && ranked[j].s === ranked[i].s) j++;
    const tier = ranked.slice(i, j).map((x) => x.e);
    ordered.push(...rotate(tier, seed % tier.length));
    i = j;
  }

  const chosen: Exercise[] = [];
  const perPattern = new Map<MovementPattern, number>();
  for (const e of ordered) {
    if (chosen.length >= count) break;
    const used = perPattern.get(e.pattern) ?? 0;
    if (used >= 2) continue;
    chosen.push(e);
    perPattern.set(e.pattern, used + 1);
  }
  // Fallback: if diversity limited the pick, top up from what's left.
  if (chosen.length < count) {
    for (const e of ordered) {
      if (chosen.length >= count) break;
      if (!chosen.includes(e)) chosen.push(e);
    }
  }
  return chosen;
}

// --- prescription ----------------------------------------------------------

function tempoFor(category: ExerciseCategory): string | undefined {
  switch (category) {
    case "power":
      return "Explosive — full reset between reps";
    case "strength":
      return "Controlled: ~2–3s down, drive up";
    case "conditioning":
      return "Steady, quick feet";
    default:
      return undefined;
  }
}

function prescribe(ex: Exercise, sets: number, restSec: number): PrescribedExercise {
  return {
    exerciseId: ex.id,
    name: ex.name,
    sets,
    reps: ex.defaultReps,
    tempo: tempoFor(ex.category),
    restSec,
    cues: ex.cues.slice(0, 3),
    regression: ex.regression,
  };
}

// --- block builders --------------------------------------------------------

function warmup(ctx: DayContext, flags: DayFlags, forPower: boolean): SessionBlock {
  const count = forPower ? 4 : 3;
  const chosen = pick(pool(ctx, { category: "warmup" }), count, `${ctx.dateISO}:warmup`, ctx, flags);
  // On power days, guarantee an ankle/plyo primer is present.
  if (forPower && !chosen.some((e) => e.id === "wu-pogo-primer")) {
    const primer = pool(ctx, { category: "warmup" }).find((e) => e.id === "wu-pogo-primer");
    if (primer) chosen.splice(chosen.length - 1, 1, primer);
  }
  return {
    label: "Warm-up",
    intent: "Raise the heart rate and prep joints — never skip this.",
    exercises: chosen.map((e) => prescribe(e, 1, 20)),
  };
}

function cooldown(ctx: DayContext, flags: DayFlags, count = 3): SessionBlock {
  const chosen = pick(pool(ctx, { category: "mobility" }), count, `${ctx.dateISO}:cooldown`, ctx, flags);
  return {
    label: "Cool-down",
    intent: "Bring it down, open the shoulders and wrists (racket arm loves this).",
    exercises: chosen.map((e) => prescribe(e, 1, 15)),
  };
}

function powerSession(ctx: DayContext, flags: DayFlags, targets: Targets): SessionBlock[] {
  const mainCount = targets.totalMinutes >= 40 ? 4 : 3;
  const sets = flags.readiness >= 0.7 ? 3 : 2;
  const powerPicks = pick(pool(ctx, { category: "power" }), mainCount, `${ctx.dateISO}:power`, ctx, flags);
  const accessory = pick(
    pool(ctx, { patterns: ["pull", "core"], category: "strength" }),
    2,
    `${ctx.dateISO}:power-acc`,
    ctx,
    flags,
  );
  return [
    warmup(ctx, flags, true),
    {
      label: "Power & speed",
      intent: "Move as fast as you can. Rest fully so every rep is explosive.",
      exercises: powerPicks.map((e) => prescribe(e, sets, 75)),
    },
    {
      label: "Strength finisher",
      intent: "A little pulling and core to round it out.",
      exercises: accessory.map((e) => prescribe(e, 2, 60)),
    },
    cooldown(ctx, flags, 2),
  ];
}

function strengthSession(ctx: DayContext, flags: DayFlags, targets: Targets): SessionBlock[] {
  const sets = flags.readiness >= 0.6 && targets.totalMinutes >= 40 ? 3 : 2;
  const legsCompromised =
    flags.tennis === "practice" ||
    (flags.soreAreas.includes("legs") && flags.soreness >= 3);

  const push = pick(pool(ctx, { patterns: ["push"], category: "strength" }), 1, `${ctx.dateISO}:push`, ctx, flags);
  const pull = pick(pool(ctx, { patterns: ["pull"], category: "strength" }), 1, `${ctx.dateISO}:pull`, ctx, flags);

  // "B" work: keep legs off practice/sore days, favour core + rotation (tennis).
  const bPatterns: MovementPattern[] = legsCompromised
    ? ["core", "rotation", "shoulder_health"]
    : ["squat", "lunge", "hinge"];
  const bMain = pick(pool(ctx, { patterns: bPatterns }), legsCompromised ? 2 : 1, `${ctx.dateISO}:b1`, ctx, flags);
  const core = legsCompromised
    ? []
    : pick(pool(ctx, { patterns: ["core", "rotation"] }), 1, `${ctx.dateISO}:core`, ctx, flags);

  const blocks: SessionBlock[] = [
    warmup(ctx, flags, false),
    {
      label: "Strength A — push + pull",
      intent: "Build the base. Clean reps, controlled tempo.",
      exercises: [...push, ...pull].map((e) => prescribe(e, sets, 60)),
    },
    {
      label: legsCompromised ? "Strength B — core + control" : "Strength B — legs + core",
      intent: legsCompromised
        ? "Legs get a break today — core and rotation carry the load."
        : "Single-leg and core strength that shows up on court.",
      exercises: [...bMain, ...core].map((e) => prescribe(e, sets, 60)),
    },
  ];

  // Optional finisher when there's time and gas, and it's not a tennis day.
  if (targets.totalMinutes >= 40 && flags.readiness >= 0.5 && flags.tennis === "none") {
    const finisher = pick(pool(ctx, { category: "conditioning" }), 1, `${ctx.dateISO}:fin`, ctx, flags);
    blocks.push({
      label: "Finisher",
      intent: "Short and sharp — footwork and work capacity.",
      exercises: finisher.map((e) => prescribe(e, 3, 45)),
    });
  }

  blocks.push(cooldown(ctx, flags, 2));
  return blocks;
}

function mobilitySession(ctx: DayContext, flags: DayFlags): SessionBlock[] {
  const gentle = pick(
    pool(ctx, { patterns: ["warmup", "mobility"], category: "warmup" }),
    2,
    `${ctx.dateISO}:m-gentle`,
    ctx,
    flags,
  );
  const flow = pick(pool(ctx, { category: "mobility" }), 4, `${ctx.dateISO}:m-flow`, ctx, flags);
  const breathe = pool(ctx, { category: "mobility" }).filter((e) => e.id === "mo-breathe");
  return [
    {
      label: "Easy activation",
      intent: "Gentle movement to get blood flowing.",
      exercises: gentle.map((e) => prescribe(e, 1, 15)),
    },
    {
      label: "Mobility flow",
      intent: "Shoulders, wrists, hips, spine. Slow and pain-free.",
      exercises: flow.map((e) => prescribe(e, 1, 15)),
    },
    {
      label: "Down-regulate",
      intent: "Long exhales — recovery starts here.",
      exercises: (breathe.length ? breathe : flow.slice(0, 1)).map((e) => prescribe(e, 1, 0)),
    },
  ];
}

function restSession(ctx: DayContext, flags: DayFlags): SessionBlock[] {
  const easy = pick(pool(ctx, { category: "mobility" }), 2, `${ctx.dateISO}:rest`, ctx, flags);
  const breathe = pool(ctx, { category: "mobility" }).filter((e) => e.id === "mo-breathe");
  return [
    {
      label: "Recover",
      intent: "Rest is where you get faster and stronger. A short walk counts.",
      exercises: [...easy, ...breathe].map((e) => prescribe(e, 1, 0)),
    },
  ];
}

export function buildBlocks(
  type: SessionType,
  ctx: DayContext,
  flags: DayFlags,
  targets: Targets,
): SessionBlock[] {
  switch (type) {
    case "POWER":
      return powerSession(ctx, flags, targets);
    case "STRENGTH":
      return strengthSession(ctx, flags, targets);
    case "CONDITIONING":
    case "MOBILITY":
      return mobilitySession(ctx, flags);
    case "REST":
      return restSession(ctx, flags);
  }
}
