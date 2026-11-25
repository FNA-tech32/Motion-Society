/**
 * Core domain types for Motion Society — a single-user, tennis-first training + fuel
 * dashboard for Matthew (15, home training: pull-up bar + dumbbells + bodyweight).
 *
 * The workout engine (src/lib/engine) turns a Profile + Checkin + Calendar into a
 * WorkoutPlan. The AI agent (Phase B) reads/writes Profile, Memory, and Nutrition.
 */

// --- Equipment & movement -------------------------------------------------

export type Equipment = "bodyweight" | "pullup_bar" | "dumbbell";

export type MovementPattern =
  | "push"
  | "pull"
  | "squat"
  | "hinge"
  | "lunge"
  | "core"
  | "rotation"
  | "plyo"
  | "sprint"
  | "carry"
  | "mobility"
  | "shoulder_health"
  | "wrist_forearm"
  | "warmup";

export type ExerciseCategory =
  | "warmup"
  | "power"
  | "strength"
  | "conditioning"
  | "mobility";

export interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  pattern: MovementPattern;
  equipment: Equipment[];
  youthSafe: true;
  tennisTransfer: boolean;
  cues: string[];
  regression: string;
  progression?: string;
  defaultReps: string;
  unilateral?: boolean;
}

// --- Session model --------------------------------------------------------

export type SessionType =
  | "POWER"
  | "STRENGTH"
  | "CONDITIONING"
  | "MOBILITY"
  | "REST";

// --- Calendar -------------------------------------------------------------

export type EventKind =
  | "tennis_match"
  | "tennis_practice"
  | "school"
  | "busy"
  | "free";

export interface CalendarEvent {
  title: string;
  kind: EventKind;
  startISO?: string;
  endISO?: string;
  durationMin?: number;
}

// --- Daily check-in -------------------------------------------------------

export type SorenessArea = "legs" | "upper" | "core" | "shoulders";

export interface Checkin {
  dateISO: string;
  energy: number;
  sleepQuality: number;
  soreness: number;
  soreAreas: SorenessArea[];
  minutesAvailable: number;
  note: string;
  createdAtISO: string;
}

// --- Profile --------------------------------------------------------------

export type Goal = "tennis" | "explosive" | "physique";

export type MetricKey =
  | "max_pullups"
  | "max_pushups"
  | "vertical_cm"
  | "broad_jump_cm"
  | "sprint20m_s"
  | "plank_s"
  | "hang_s"
  | "db_goblet_reps"
  | "split_squat_reps"
  | "bodyweight_kg";

export interface Profile {
  name: string;
  dobISO: string;
  bodyweightKg: number | null;
  goalWeights: Record<Goal, number>;
  equipment: Equipment[];
  daysPerWeek: number;
  injuries: string;
  baselines: Partial<Record<MetricKey, number>>;
  createdAtISO: string;
  updatedAtISO: string;
}

// --- Progress metrics -----------------------------------------------------

export interface Metric {
  id: string;
  dateISO: string;
  key: MetricKey;
  value: number;
  createdAtISO: string;
}

// --- Generated plan -------------------------------------------------------

export interface PrescribedExercise {
  exerciseId: string;
  name: string;
  sets: number;
  reps: string;
  tempo?: string;
  restSec: number;
  cues: string[];
  regression: string;
  note?: string;
}

export interface SessionBlock {
  label: string;
  intent: string;
  exercises: PrescribedExercise[];
}

export interface Targets {
  sessionType: SessionType;
  readiness: number;
  totalMinutes: number;
  intensityNote: string;
  focus: string[];
}

export interface WorkoutPlan {
  dateISO: string;
  sessionType: SessionType;
  title: string;
  why: string;
  targets: Targets;
  blocks: SessionBlock[];
  disclaimer: string;
  status: "planned" | "done" | "skipped";
  generatedBy: string;
  createdAtISO: string;
}

export interface DayContext {
  dateISO: string;
  profile: Profile;
  checkin: Checkin;
  events: CalendarEvent[];
}

// --- Video addons ---------------------------------------------------------

/**
 * An exercise the AI pulled out of a video Matthew gave it. Deliberately NOT an
 * `Exercise`: addons never enter the curated library and the deterministic engine
 * never picks them. They render as an extra block after the engine's blocks, and
 * he can dismiss any of them.
 */
export interface AddonExercise {
  name: string;
  sets: number;
  reps: string;
  cues: string[];
  regression: string;
  /** Why this movement, in one line — grounded in what the video showed. */
  why?: string;
}

export type AddonSourceKind = "upload" | "link";

export interface PlanAddon {
  id: string;
  dateISO: string;
  title: string;
  intent: string;
  sourceKind: AddonSourceKind;
  /** Filename, or the URL that was analyzed. */
  sourceLabel: string;
  exercises: AddonExercise[];
  createdAtISO: string;
}

// --- Memory (the living store the AI reads + writes) ----------------------

export type MemorySource = "you" | "ai" | "seed";

export type MemoryCategory =
  | "training"
  | "nutrition"
  | "schedule"
  | "body"
  | "preference"
  | "general";

export interface MemoryFact {
  id: string;
  text: string;
  category: MemoryCategory;
  source: MemorySource;
  createdAtISO: string;
}

// --- Nutrition (PLACEHOLDER until the AI research pass personalizes it) ----

export type MealSlot = "breakfast" | "lunch" | "dinner" | "snack";

export interface Meal {
  id: string;
  name: string;
  slot: MealSlot;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  /** true = AI-planned, false = logged by the user. */
  planned: boolean;
}

export interface NutritionTargets {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  waterMl: number;
  /** true until the AI research pass replaces these with personalized numbers. */
  placeholder: boolean;
}

export interface NutritionDay {
  dateISO: string;
  meals: Meal[];
  waterMl: number;
}

// --- AI settings ----------------------------------------------------------

export interface AISettings {
  /** Anthropic API key, kept on-device (localStorage). Sent only to our own /api/agent. */
  apiKey: string | null;
  model: string;
}
