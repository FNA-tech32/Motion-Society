import type { MemoryCategory, MemoryFact, Profile } from "@/lib/types";

/**
 * Shown on every generated plan. Motion Society programs training for a minor, so the
 * safety framing is always present — never buried.
 */
export const DISCLAIMER =
  "Not medical advice. Warm up, keep clean form, and stop if something hurts — " +
  "tell a parent, coach, or doctor about any pain that isn't just normal muscle fatigue.";

/**
 * Motion Society is single-user and already knows Matthew — no onboarding. This is the
 * seeded profile the store boots with (editable in Settings or by the AI).
 */
export function defaultProfile(nowISO = "2026-07-07T00:00:00.000Z"): Profile {
  return {
    name: "Matthew",
    dobISO: "2010-10-12",
    bodyweightKg: null,
    goalWeights: { tennis: 5, explosive: 4, physique: 2 },
    equipment: ["bodyweight", "pullup_bar", "dumbbell"],
    daysPerWeek: 4,
    injuries: "",
    baselines: {},
    createdAtISO: nowISO,
    updatedAtISO: nowISO,
  };
}

/** Is on-court performance weighted at least as high as aesthetics? */
export function tennisFirst(profile: Profile): boolean {
  return profile.goalWeights.tennis >= profile.goalWeights.physique;
}

const SEEDED_AT = "2026-07-07T00:00:00.000Z";

function fact(id: string, text: string, category: MemoryCategory): MemoryFact {
  return { id, text, category, source: "seed", createdAtISO: SEEDED_AT };
}

/**
 * What the app "already knows" on first boot — seeds the Memory page so it never
 * feels like a blank setup, and gives the AI real grounding instead of guesswork.
 *
 * Two kinds of fact live here, deliberately:
 *   1. About Matthew — his body, sport, gear, priorities.
 *   2. Domain knowledge — the training / calisthenics / tennis / nutrition
 *      principles the coach reasons from. Phrased as principles, not
 *      prescriptions, and youth-safe throughout (fuel to perform, never a cut).
 *
 * The AI adds to this as he talks to it, and he can edit or delete any of it.
 */
export const SEED_MEMORY: MemoryFact[] = [
  // ------------------------------------------------------------------- him
  fact("seed-age", "15 years old (born Oct 12, 2010), Korean.", "body"),
  fact("seed-sports", "Plays tennis competitively and trains calisthenics.", "training"),
  fact("seed-gear", "Trains at home: pull-up bar, dumbbells, and bodyweight.", "training"),
  fact(
    "seed-goal",
    "Wants to get faster and more explosive for tennis, with a lean athletic physique.",
    "preference",
  ),
  fact(
    "seed-priority",
    "Tennis comes first — when on-court performance and aesthetics conflict, the court wins.",
    "preference",
  ),
  fact(
    "seed-growing",
    "Still growing: the goal is always to add capability, never to lose weight or restrict food.",
    "body",
  ),

  // -------------------------------------------------------------- training
  fact(
    "kb-train-power-first",
    "Power and speed work goes first in a session, while the nervous system is fresh — never after fatiguing strength work.",
    "training",
  ),
  fact(
    "kb-train-quality",
    "Explosive reps are a quality lift, not conditioning: low reps, full rest, and end the set the moment jump height or bar speed drops.",
    "training",
  ),
  fact(
    "kb-train-youth",
    "Youth training is technique-first: no maximal 1-rep-max testing, no grinding loaded movements to failure. Earn reps and quality before load.",
    "training",
  ),
  fact(
    "kb-train-overload",
    "Progressive overload drives every adaptation — small consistent weekly increases in reps, sets, range, or difficulty beat occasional hard sessions.",
    "training",
  ),
  fact(
    "kb-train-recovery",
    "Adaptation happens during recovery, not during the session. Sleep (8-10h for a teen) and rest days are part of the program, not a break from it.",
    "training",
  ),
  fact(
    "kb-train-balance",
    "Keep push and pull volume roughly balanced — tennis already overloads one side of the body and the front of the shoulder.",
    "training",
  ),
  fact(
    "kb-train-unilateral",
    "Single-leg work (split squats, step-ups, lateral bounds) transfers to court movement better than bilateral squats alone — tennis is played one leg at a time.",
    "training",
  ),

  // ---------------------------------------------------------- calisthenics
  fact(
    "kb-cal-leverage",
    "Calisthenics progresses by leverage and range, not plates: incline → knee → full → decline push-up; scapular pull → negative → full → weighted pull-up.",
    "training",
  ),
  fact(
    "kb-cal-scap",
    "Every pull-up starts with a scapular pull — shoulder blades down and back before the elbows bend. Skipping it is the most common form fault.",
    "training",
  ),
  fact(
    "kb-cal-straight-arm",
    "Straight-arm strength (hollow holds, planche leans, L-sits) builds the connective-tissue base that makes advanced calisthenics safe.",
    "training",
  ),
  fact(
    "kb-cal-core",
    "The calisthenics core is anti-movement: anti-extension (hollow hold), anti-rotation (Pallof press), anti-lateral-flexion (suitcase carry). Crunches transfer poorly.",
    "training",
  ),
  fact(
    "kb-cal-frequency",
    "Bodyweight skills respond to frequency: three short quality sessions a week beat one long grind, because skill is practiced, not exhausted.",
    "training",
  ),

  // --------------------------------------------------------------- tennis
  fact(
    "kb-tennis-chain",
    "A serve or groundstroke is a kinetic chain: force starts at the ground through the legs, transfers through hips and trunk rotation, and the arm goes last. Train the legs and trunk to improve the arm.",
    "training",
  ),
  fact(
    "kb-tennis-movement",
    "Match movement is lateral and diagonal bursts under five seconds with sharp direction changes. Deceleration and re-acceleration matter more than top-end straight-line speed.",
    "training",
  ),
  fact(
    "kb-tennis-rotation",
    "Rotational power (med-ball throws, band chops, hip-turn drills) is the most direct off-court transfer to racket-head speed.",
    "training",
  ),
  fact(
    "kb-tennis-shoulder",
    "Tennis players need dedicated shoulder health work — external rotation, rows, scapular control — to protect the racket-arm rotator cuff from serve volume.",
    "training",
  ),
  fact(
    "kb-tennis-wrist",
    "Wrist and forearm work (extensors, flexors, grip) guards against the overuse strain racket sports load onto the elbow.",
    "training",
  ),
  fact(
    "kb-tennis-legday",
    "Never program heavy or high-volume leg work the day before a match, and go easy on legs the day of practice — court time is leg volume.",
    "schedule",
  ),

  // ------------------------------------------------------------ nutrition
  fact(
    "kb-nut-fuel",
    "Nutrition here is fuel to perform. For a growing 15-year-old athlete there is never a cut, deficit, or weight-loss goal — under-fuelling costs recovery, growth, and speed.",
    "nutrition",
  ),
  fact(
    "kb-nut-protein",
    "Roughly 1.6-2.0 g of protein per kg of bodyweight per day supports training adaptation in a young athlete. Beyond that adds little.",
    "nutrition",
  ),
  fact(
    "kb-nut-carbs",
    "Carbohydrate is the primary fuel for tennis. Hard sessions and long matches need carbs before and after — low-carb training tanks on-court output.",
    "nutrition",
  ),
  fact(
    "kb-nut-timing",
    "Eat a carb-forward meal 2-3 hours before playing, and get protein plus carbs within about an hour after training.",
    "nutrition",
  ),
  fact(
    "kb-nut-hydration",
    "Hydration is a performance variable, not a comfort one — even mild dehydration slows reaction time and footwork. Add electrolytes for long or hot sessions.",
    "nutrition",
  ),
  fact(
    "kb-nut-organic",
    "He prefers organic, whole, minimally-processed food: pasture-raised eggs, wild-caught fish, grass-fed meat, organic produce, whole grains, nuts, olive oil.",
    "nutrition",
  ),
  fact(
    "kb-nut-wholefood",
    "'Organic' is a farming standard, not a nutrition one — an organic cookie is still a cookie. Whole and minimally-processed comes first, organic second.",
    "nutrition",
  ),
  fact(
    "kb-nut-selective-organic",
    "When organic has to be selective, spend it on thin-skinned produce (berries, spinach, apples, peppers) and animal products; thick-skinned produce (bananas, avocado, onion) matters less.",
    "nutrition",
  ),
  fact(
    "kb-nut-korean",
    "Korean staples fit an athlete's plate well: rice for carbs, grilled fish or bulgogi for protein, fermented vegetables like kimchi for gut health.",
    "nutrition",
  ),
  fact(
    "kb-nut-micros",
    "Iron, calcium, and vitamin D matter especially for a growing athlete — leafy greens, dairy or fortified alternatives, oily fish, sunlight.",
    "nutrition",
  ),
  fact(
    "kb-nut-supplements",
    "Food first. A teen athlete eating well needs no supplements, and nothing gets recommended without a parent and a doctor in the loop.",
    "nutrition",
  ),
];

/**
 * Bump whenever SEED_MEMORY gains entries. `bootstrap()` backfills seed facts
 * whose ids are missing, so a browser seeded on an older version picks up the
 * new knowledge instead of staying frozen at whatever shipped that day.
 *
 * Trade-off: a seed fact he deleted comes back on the next bump. He can delete
 * it again, and only a bump can resurrect it.
 */
export const SEED_VERSION = 2;
