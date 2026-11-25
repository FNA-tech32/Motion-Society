import type {
  AddonExercise,
  Goal,
  MemoryCategory,
  MetricKey,
  NutritionTargets,
  Profile,
  SorenessArea,
} from "@/lib/types";

/** Allowed values, shared by the tool schema and server-side validation. */
export const METRIC_KEYS: MetricKey[] = [
  "max_pullups",
  "max_pushups",
  "vertical_cm",
  "broad_jump_cm",
  "sprint20m_s",
  "plank_s",
  "hang_s",
  "db_goblet_reps",
  "split_squat_reps",
  "bodyweight_kg",
];

export const MEMORY_CATEGORIES: MemoryCategory[] = [
  "training",
  "nutrition",
  "schedule",
  "body",
  "preference",
  "general",
];

const SORE_AREAS: SorenessArea[] = ["legs", "upper", "core", "shoulders"];

/** Safety floor — the AI must never push a growing teen's fuel into a deficit. */
export const KCAL_FLOOR = 1800;

/** Ceilings for a video-derived addon block. The engine owns the real workout. */
export const ADDON_MAX_EXERCISES = 5;
export const ADDON_MAX_SETS = 5;

// --- what the client sends -------------------------------------------------

export interface AgentSnapshot {
  profile: Profile;
  memory: string[];
  nutrition: NutritionTargets;
  recentMetrics: { key: string; value: number; dateISO: string }[];
  todayISO: string;
}

// --- what the agent returns (the tool input) -------------------------------

export interface AgentUpdates {
  reply: string;
  memory?: { text: string; category: MemoryCategory }[];
  metrics?: { key: MetricKey; value: number }[];
  profile?: Partial<Pick<Profile, "name" | "bodyweightKg" | "daysPerWeek" | "injuries">> & {
    goalWeights?: Partial<Record<Goal, number>>;
  };
  nutrition?: Partial<Pick<NutritionTargets, "kcal" | "protein" | "carbs" | "fat" | "waterMl">>;
  checkin?: Partial<{
    energy: number;
    sleepQuality: number;
    soreness: number;
    soreAreas: SorenessArea[];
    minutesAvailable: number;
    tennis: "none" | "practice" | "match";
  }>;
  /** Only the video route asks for this — an extra block, never an engine override. */
  workout?: {
    title: string;
    intent: string;
    exercises: AddonExercise[];
  };
}

/** JSON Schema for the forced `apply` tool. Everything optional except `reply`. */
export const APPLY_TOOL = {
  name: "apply",
  description:
    "Translate the user's message into structured updates to Motion Society's dashboard. Call this exactly once.",
  input_schema: {
    type: "object",
    properties: {
      reply: {
        type: "string",
        description: "One or two warm, encouraging sentences confirming what you did or answering.",
      },
      memory: {
        type: "array",
        description: "Durable facts worth remembering (preferences, schedule, body, constraints). Short, specific.",
        items: {
          type: "object",
          properties: {
            text: { type: "string" },
            category: { type: "string", enum: MEMORY_CATEGORIES },
          },
          required: ["text", "category"],
        },
      },
      metrics: {
        type: "array",
        description: "Performance results the user reported today.",
        items: {
          type: "object",
          properties: {
            key: { type: "string", enum: METRIC_KEYS },
            value: { type: "number" },
          },
          required: ["key", "value"],
        },
      },
      profile: {
        type: "object",
        description: "Durable profile changes only.",
        properties: {
          name: { type: "string" },
          bodyweightKg: { type: "number" },
          daysPerWeek: { type: "number" },
          injuries: { type: "string" },
          goalWeights: {
            type: "object",
            properties: {
              tennis: { type: "number" },
              explosive: { type: "number" },
              physique: { type: "number" },
            },
          },
        },
      },
      nutrition: {
        type: "object",
        description: "Fuel targets. This is a growing 15-year-old athlete: fuel to perform, never a cut or deficit.",
        properties: {
          kcal: { type: "number" },
          protein: { type: "number" },
          carbs: { type: "number" },
          fat: { type: "number" },
          waterMl: { type: "number" },
        },
      },
      checkin: {
        type: "object",
        description: "How the user feels today, if they said.",
        properties: {
          energy: { type: "number", minimum: 1, maximum: 5 },
          sleepQuality: { type: "number", minimum: 1, maximum: 5 },
          soreness: { type: "number", minimum: 0, maximum: 5 },
          soreAreas: { type: "array", items: { type: "string", enum: SORE_AREAS } },
          minutesAvailable: { type: "number" },
          tennis: { type: "string", enum: ["none", "practice", "match"] },
        },
      },
      workout: {
        type: "object",
        description:
          "ONLY when analyzing a video. An extra block appended to today's plan — never a replacement for it. Home equipment only: bodyweight, pull-up bar, dumbbells.",
        properties: {
          title: { type: "string", description: "Short name, e.g. 'Scapular control work'." },
          intent: { type: "string", description: "One sentence: what this block is for." },
          exercises: {
            type: "array",
            maxItems: ADDON_MAX_EXERCISES,
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                sets: { type: "number", minimum: 1, maximum: ADDON_MAX_SETS },
                reps: { type: "string", description: "e.g. '8-10' or '30s'." },
                cues: { type: "array", items: { type: "string" }, maxItems: 3 },
                regression: { type: "string", description: "An easier fallback. Required." },
                why: { type: "string", description: "One line tying it to what the video showed." },
              },
              required: ["name", "sets", "reps", "regression"],
            },
          },
        },
        required: ["title", "intent", "exercises"],
      },
    },
    required: ["reply"],
  },
} as const;

const clampInt = (n: unknown, lo: number, hi: number, fallback: number): number =>
  typeof n === "number" && Number.isFinite(n) ? Math.min(hi, Math.max(lo, Math.round(n))) : fallback;

const str = (v: unknown, max: number): string => (typeof v === "string" ? v.trim().slice(0, max) : "");

/**
 * Addons come from a model looking at a video, so treat every field as hostile:
 * cap the volume, force a regression, and drop anything nameless. Worst case the
 * block is useless — never unsafe.
 */
function sanitizeWorkout(raw: AgentUpdates["workout"]): AgentUpdates["workout"] | undefined {
  if (!raw || typeof raw !== "object" || !Array.isArray(raw.exercises)) return undefined;

  const exercises: AddonExercise[] = raw.exercises
    .filter((e) => e && str(e.name, 60))
    .slice(0, ADDON_MAX_EXERCISES)
    .map((e) => ({
      name: str(e.name, 60),
      sets: clampInt(e.sets, 1, ADDON_MAX_SETS, 2),
      reps: str(e.reps, 24) || "8-10",
      cues: Array.isArray(e.cues) ? e.cues.map((c) => str(c, 90)).filter(Boolean).slice(0, 3) : [],
      regression: str(e.regression, 140) || "Reduce the range of motion and slow it down.",
      why: str(e.why, 160) || undefined,
    }));

  if (!exercises.length) return undefined;
  return {
    title: str(raw.title, 48) || "From your videos",
    intent: str(raw.intent, 200) || "Extra work drawn from a video you shared.",
    exercises,
  };
}

/** Trust nothing the model returns: keep only known keys and enforce the fuel floor. */
export function sanitizeUpdates(raw: AgentUpdates): AgentUpdates {
  const out: AgentUpdates = {
    reply: typeof raw?.reply === "string" && raw.reply.trim() ? raw.reply.trim() : "Done.",
  };
  if (Array.isArray(raw?.memory)) {
    out.memory = raw.memory
      .filter((m) => m && typeof m.text === "string" && m.text.trim())
      .map((m) => ({ text: m.text.trim(), category: m.category }));
  }
  if (Array.isArray(raw?.metrics)) {
    out.metrics = raw.metrics.filter((m) => METRIC_KEYS.includes(m.key) && Number.isFinite(m.value));
  }
  if (raw?.profile && typeof raw.profile === "object") out.profile = raw.profile;
  if (raw?.nutrition && typeof raw.nutrition === "object") {
    const n = { ...raw.nutrition };
    if (typeof n.kcal === "number") n.kcal = Math.max(KCAL_FLOOR, Math.round(n.kcal));
    out.nutrition = n;
  }
  if (raw?.checkin && typeof raw.checkin === "object") out.checkin = raw.checkin;
  const workout = sanitizeWorkout(raw?.workout);
  if (workout) out.workout = workout;
  return out;
}

export function buildSystemPrompt(snapshot: AgentSnapshot): string {
  const p = snapshot.profile;
  const metrics = snapshot.recentMetrics
    .slice(-12)
    .map((m) => `${m.key}=${m.value} (${m.dateISO})`)
    .join(", ") || "none logged yet";

  return `You are Motion Society, a warm personal coach and assistant for ${p.name || "Matthew"}, a 15-year-old competitive tennis player who also does calisthenics and trains at home (pull-up bar, dumbbells, bodyweight). You maintain his training + fuel dashboard.

Read the user's message and translate it into structured updates by calling the "apply" tool exactly once.

RULES
- Remember durable facts (preferences, schedule, body, constraints) in "memory". Keep each short and specific, e.g. "Trains best in the morning".
- If the user reports a performance result, add it to "metrics" using ONLY the allowed keys.
- If they describe how they feel today (energy, sleep, soreness, time, tennis), set "checkin".
- Update "profile" only for durable changes (name, bodyweight, days/week, injuries, goal priorities).
- NUTRITION SAFETY: he is 15 and growing. Guidance is FUEL TO PERFORM — never a diet, cut, or calorie deficit, and never encourage restriction or weight loss. Only adjust nutrition targets if clearly warranted; otherwise leave it out.
- WORKOUT SAFETY: never prescribe maximal 1-rep-max testing or unsafe loading. The training engine sets the actual workout; you don't override it here.
- "reply": 1-2 encouraging sentences. If anything sounds like real pain or injury, gently suggest resting and telling a parent, coach, or doctor. You are not a medical professional.

WHAT I ALREADY KNOW ABOUT HIM
Profile: dob ${p.dobISO}, ${p.daysPerWeek} days/week, goals tennis=${p.goalWeights.tennis} explosive=${p.goalWeights.explosive} physique=${p.goalWeights.physique}${p.injuries ? `, injuries: ${p.injuries}` : ""}.
Memory: ${snapshot.memory.length ? snapshot.memory.map((m) => `"${m}"`).join("; ") : "nothing yet"}.
Recent metrics: ${metrics}.
Fuel targets (placeholder=${snapshot.nutrition.placeholder}): ${snapshot.nutrition.kcal} kcal, ${snapshot.nutrition.protein}g protein.`;
}

export function buildResearchPrompt(
  snapshot: AgentSnapshot,
  focus: "all" | "nutrition" | "training",
): string {
  const p = snapshot.profile;
  const focusLine =
    focus === "nutrition"
      ? "Focus on NUTRITION: research evidence-based daily calorie + macro targets and meal guidance for a growing teen tennis athlete."
      : focus === "training"
        ? "Focus on TRAINING: research the most effective, safe way to build a teen tennis player's speed, explosiveness, and physique at home."
        : "Research BOTH his optimal training approach AND his optimal fuel (calories + macros).";

  return `You are Motion Society's research coach for ${p.name || "Matthew"}, a 15-year-old competitive tennis player who trains at home (pull-up bar, dumbbells, bodyweight). Goals: tennis-first speed, explosiveness, and a lean athletic physique.

Use web search to find current, credible, age-appropriate sport-science guidance. ${focusLine}

CRITICAL SAFETY
- He is 15 and GROWING. Nutrition is FUEL TO PERFORM — never a diet, cut, or calorie deficit; never recommend weight loss or restriction.
- Training must be youth-safe: technique-first, no maximal 1-rep-max testing.
- Prefer reputable sources (sports science, athlete/pediatric nutrition, NSCA-style guidance).

After researching, call the "apply" tool ONCE with:
- "nutrition": realistic daily kcal + protein/carbs/fat + waterMl grounded in what you found (fuel, not a deficit).
- "memory": 2-5 durable, specific, useful insights (e.g. "~1.6-2.0 g/kg protein for a teen athlete").
- "reply": a warm 2-3 sentence summary of what you changed and why.
You MUST finish by calling apply. Keep every number sane for a growing teen athlete.

CONTEXT
Profile: dob ${p.dobISO}, ${p.daysPerWeek} days/week, bodyweight ${p.bodyweightKg ?? "unknown"} kg.
Memory: ${snapshot.memory.length ? snapshot.memory.slice(0, 20).map((m) => `"${m}"`).join("; ") : "nothing yet"}.
Current fuel (placeholder=${snapshot.nutrition.placeholder}): ${snapshot.nutrition.kcal} kcal, ${snapshot.nutrition.protein}g protein.`;
}

/**
 * Video analysis. Two shapes reach the model: sampled frames (vision) or a URL
 * it reads with web search. The prompt is the same because the job is the same —
 * turn what the video shows into an addon block plus durable memory.
 */
export function buildVideoPrompt(snapshot: AgentSnapshot, kind: "upload" | "link"): string {
  const p = snapshot.profile;
  const inputLine =
    kind === "upload"
      ? `You are being shown STILL FRAMES sampled in order from a short training video. Read them as a movement over time, not as separate photos. They may show ${p.name || "Matthew"} himself performing a movement (judge his form), or a coach/athlete demonstrating something he wants to learn.`
      : `You are given a LINK to a training video. Use web search to read its title, description, transcript, and any surrounding page text. You cannot see the pixels — reason only from the text you actually find, and say so plainly if the page gives you little to work with.`;

  return `You are Motion Society's video coach for ${p.name || "Matthew"}, a 15-year-old competitive tennis player who trains at home with a pull-up bar, dumbbells, and bodyweight.

${inputLine}

YOUR JOB
1. Identify the movement(s) and what is actually being demonstrated.
2. If it is him, assess form: name the single highest-value correction, not a list of nitpicks.
3. Translate it into an addon block for today via the "apply" tool's "workout" field — at most ${ADDON_MAX_EXERCISES} exercises, at most ${ADDON_MAX_SETS} sets each.
4. Record what's durable in "memory" (a recurring form fault, a movement he wants to learn, a preference). Skip memory entirely if nothing durable came up.

HARD LIMITS
- HOME EQUIPMENT ONLY: bodyweight, pull-up bar, dumbbells. If the video uses a barbell, machine, rings, or a sled, substitute the closest safe home equivalent and say what you swapped and why.
- YOUTH-SAFE: he is 15. No maximal 1-rep-max testing, no loaded spinal work to failure, no advanced skills (planche, front lever, muscle-up, deep plyometric depth jumps) unless the prerequisite strength is already in his memory or metrics. Progress leverage before load.
- Every exercise needs a "regression" — the easier version he drops to when form breaks.
- You do NOT set today's main workout. The training engine owns that. Your block is appended after it.
- If the video shows something unsafe, dangerous for a teen, or is not a training video at all, say so in "reply" and return NO "workout" field.
- If anything looks like real pain or injury, tell him to rest and talk to a parent, coach, or doctor. You are not a medical professional.

"reply" is 2-3 warm sentences: what you saw, the one correction that matters, what you added.

WHAT I ALREADY KNOW ABOUT HIM
Profile: dob ${p.dobISO}, ${p.daysPerWeek} days/week, bodyweight ${p.bodyweightKg ?? "unknown"} kg${p.injuries ? `, injuries: ${p.injuries}` : ""}.
Goals: tennis=${p.goalWeights.tennis} explosive=${p.goalWeights.explosive} physique=${p.goalWeights.physique}.
Memory: ${snapshot.memory.length ? snapshot.memory.slice(0, 24).map((m) => `"${m}"`).join("; ") : "nothing yet"}.
Recent metrics: ${snapshot.recentMetrics.slice(-8).map((m) => `${m.key}=${m.value}`).join(", ") || "none logged yet"}.`;
}
