import type {
  AISettings,
  CalendarEvent,
  Checkin,
  Meal,
  MemoryCategory,
  MemoryFact,
  MemorySource,
  Metric,
  MetricKey,
  NutritionDay,
  NutritionTargets,
  PlanAddon,
  Profile,
  WorkoutPlan,
} from "@/lib/types";
import { defaultProfile, SEED_MEMORY, SEED_VERSION } from "@/lib/defaults";
import { PLACEHOLDER_TARGETS } from "@/lib/nutrition";

/**
 * Client-side, single-user store backed by localStorage. Motion Society is personalized
 * ONLY to Matthew: it boots already knowing him (see `bootstrap`) — no login, no
 * setup. Everything (profile, memory, workouts, meals, metrics, AI key) lives here
 * and persists across restarts. The AI agent reads a snapshot of this and writes
 * updates back, which is how "tell it once → it remembers everywhere" works.
 */

const KEY = "baseline.v2";
const DEFAULT_MODEL = "claude-sonnet-5";

interface Snapshot {
  seeded: boolean;
  /** Which SEED_MEMORY generation this browser has. 0 = seeded before versioning. */
  seedVersion: number;
  profile: Profile | null;
  memory: MemoryFact[];
  checkins: Record<string, Checkin>;
  events: Record<string, CalendarEvent[]>;
  plans: Record<string, WorkoutPlan>;
  addons: Record<string, PlanAddon[]>;
  metrics: Metric[];
  nutritionTargets: NutritionTargets | null;
  nutritionDays: Record<string, NutritionDay>;
  ai: AISettings;
}

const EMPTY: Snapshot = {
  seeded: false,
  seedVersion: 0,
  profile: null,
  memory: [],
  checkins: {},
  events: {},
  plans: {},
  addons: {},
  metrics: [],
  nutritionTargets: null,
  nutritionDays: {},
  ai: { apiKey: null, model: DEFAULT_MODEL },
};

function read(): Snapshot {
  if (typeof window === "undefined") return { ...EMPTY };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY };
    return { ...EMPTY, ...(JSON.parse(raw) as Snapshot) };
  } catch {
    return { ...EMPTY };
  }
}

function write(next: Snapshot): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("baseline:change"));
  } catch {
    // storage full or blocked — session still works in-memory
  }
}

function uid(): string {
  return globalThis.crypto?.randomUUID?.() ?? `id_${Math.random().toString(36).slice(2)}`;
}

/** Local date as YYYY-MM-DD (client clock — fine at runtime). */
export function todayISO(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/**
 * Seed the known-Matthew state on first load, then keep it current.
 *
 * Idempotent for everything he owns: profile, nutrition, and any memory he wrote
 * or edited are never touched. The one thing that does move is SEED_MEMORY — when
 * `SEED_VERSION` rises, seed facts he doesn't have yet get backfilled, so a
 * browser seeded months ago still learns what later versions know.
 */
export function bootstrap(): Snapshot {
  const snap = read();
  if (snap.seeded && snap.seedVersion >= SEED_VERSION) return snap;

  const have = new Set(snap.memory.map((m) => m.id));
  const missing = SEED_MEMORY.filter((m) => !have.has(m.id)).map((m) => ({ ...m }));

  const next: Snapshot = {
    ...snap,
    seeded: true,
    seedVersion: SEED_VERSION,
    profile: snap.profile ?? defaultProfile(new Date().toISOString()),
    memory: [...snap.memory, ...missing],
    nutritionTargets: snap.nutritionTargets ?? { ...PLACEHOLDER_TARGETS },
  };
  write(next);
  return next;
}

// --- profile ---------------------------------------------------------------

export function loadProfile(): Profile | null {
  return read().profile;
}

export function saveProfile(profile: Profile): void {
  const snap = read();
  write({ ...snap, profile: { ...profile, updatedAtISO: new Date().toISOString() } });
}

// --- memory ----------------------------------------------------------------

export function listMemory(): MemoryFact[] {
  return [...read().memory].sort((a, b) => b.createdAtISO.localeCompare(a.createdAtISO));
}

export function addMemory(
  text: string,
  category: MemoryCategory = "general",
  source: MemorySource = "you",
): MemoryFact {
  const snap = read();
  const fact: MemoryFact = {
    id: uid(),
    text: text.trim(),
    category,
    source,
    createdAtISO: new Date().toISOString(),
  };
  write({ ...snap, memory: [...snap.memory, fact] });
  return fact;
}

/** Batch-append (used when the AI returns several remembered facts at once). */
export function addMemories(facts: Omit<MemoryFact, "id" | "createdAtISO">[]): void {
  if (!facts.length) return;
  const snap = read();
  const now = new Date().toISOString();
  const added = facts.map((f) => ({ ...f, id: uid(), createdAtISO: now }));
  write({ ...snap, memory: [...snap.memory, ...added] });
}

export function updateMemory(id: string, patch: Partial<Pick<MemoryFact, "text" | "category">>): void {
  const snap = read();
  write({
    ...snap,
    memory: snap.memory.map((m) => (m.id === id ? { ...m, ...patch } : m)),
  });
}

export function deleteMemory(id: string): void {
  const snap = read();
  write({ ...snap, memory: snap.memory.filter((m) => m.id !== id) });
}

// --- check-ins -------------------------------------------------------------

export function loadCheckin(dateISO: string): Checkin | null {
  return read().checkins[dateISO] ?? null;
}

export function saveCheckin(checkin: Checkin): void {
  const snap = read();
  write({ ...snap, checkins: { ...snap.checkins, [checkin.dateISO]: checkin } });
}

/** A neutral default so the dashboard is never blocked on a missing check-in. */
export function defaultCheckin(dateISO: string): Checkin {
  return {
    dateISO,
    energy: 4,
    sleepQuality: 4,
    soreness: 1,
    soreAreas: [],
    minutesAvailable: 45,
    note: "",
    createdAtISO: new Date().toISOString(),
  };
}

// --- calendar events -------------------------------------------------------

export function loadEvents(dateISO: string): CalendarEvent[] {
  return read().events[dateISO] ?? [];
}

export function saveEvents(dateISO: string, events: CalendarEvent[]): void {
  const snap = read();
  write({ ...snap, events: { ...snap.events, [dateISO]: events } });
}

// --- plans -----------------------------------------------------------------

export function loadPlan(dateISO: string): WorkoutPlan | null {
  return read().plans[dateISO] ?? null;
}

export function savePlan(plan: WorkoutPlan): void {
  const snap = read();
  write({ ...snap, plans: { ...snap.plans, [plan.dateISO]: plan } });
}

export function setPlanStatus(dateISO: string, status: WorkoutPlan["status"]): void {
  const snap = read();
  const plan = snap.plans[dateISO];
  if (!plan) return;
  write({ ...snap, plans: { ...snap.plans, [dateISO]: { ...plan, status } } });
}

export function listPlans(limit = 14): WorkoutPlan[] {
  return Object.values(read().plans)
    .sort((a, b) => b.dateISO.localeCompare(a.dateISO))
    .slice(0, limit);
}

// --- video addons ----------------------------------------------------------
// Extra blocks the AI derived from a video, stored beside the plan rather than
// inside it — regenerating a plan never destroys them, and dismissing an addon
// never touches the engine's work.

export function listAddons(dateISO: string): PlanAddon[] {
  return read().addons[dateISO] ?? [];
}

export function addAddon(addon: Omit<PlanAddon, "id" | "createdAtISO">): PlanAddon {
  const snap = read();
  const full: PlanAddon = { ...addon, id: uid(), createdAtISO: new Date().toISOString() };
  const forDay = [...(snap.addons[addon.dateISO] ?? []), full];
  write({ ...snap, addons: { ...snap.addons, [addon.dateISO]: forDay } });
  return full;
}

export function deleteAddon(dateISO: string, id: string): void {
  const snap = read();
  const forDay = (snap.addons[dateISO] ?? []).filter((a) => a.id !== id);
  write({ ...snap, addons: { ...snap.addons, [dateISO]: forDay } });
}

// --- metrics ---------------------------------------------------------------

export function listMetrics(): Metric[] {
  return [...read().metrics].sort((a, b) => a.dateISO.localeCompare(b.dateISO));
}

export function addMetric(dateISO: string, key: MetricKey, value: number): Metric {
  const snap = read();
  const metric: Metric = { id: uid(), dateISO, key, value, createdAtISO: new Date().toISOString() };
  write({ ...snap, metrics: [...snap.metrics, metric] });
  return metric;
}

// --- nutrition (placeholder until AI research) -----------------------------

export function getNutritionTargets(): NutritionTargets {
  return read().nutritionTargets ?? { ...PLACEHOLDER_TARGETS };
}

export function setNutritionTargets(targets: NutritionTargets): void {
  const snap = read();
  write({ ...snap, nutritionTargets: targets });
}

export function getNutritionDay(dateISO: string): NutritionDay {
  return read().nutritionDays[dateISO] ?? { dateISO, meals: [], waterMl: 0 };
}

export function saveNutritionDay(day: NutritionDay): void {
  const snap = read();
  write({ ...snap, nutritionDays: { ...snap.nutritionDays, [day.dateISO]: day } });
}

export function addMeal(dateISO: string, meal: Omit<Meal, "id">): void {
  const day = getNutritionDay(dateISO);
  saveNutritionDay({ ...day, meals: [...day.meals, { ...meal, id: uid() }] });
}

export function removeMeal(dateISO: string, mealId: string): void {
  const day = getNutritionDay(dateISO);
  saveNutritionDay({ ...day, meals: day.meals.filter((m) => m.id !== mealId) });
}

export function setWater(dateISO: string, waterMl: number): void {
  const day = getNutritionDay(dateISO);
  saveNutritionDay({ ...day, waterMl: Math.max(0, waterMl) });
}

// --- AI settings -----------------------------------------------------------

export function getAiSettings(): AISettings {
  return read().ai;
}

export function getAiKey(): string | null {
  return read().ai.apiKey;
}

export function setAiKey(apiKey: string | null): void {
  const snap = read();
  write({ ...snap, ai: { ...snap.ai, apiKey: apiKey?.trim() || null } });
}

export function isAiConnected(): boolean {
  return Boolean(read().ai.apiKey);
}

/** Wipe everything (Settings → reset). Next load re-seeds the known profile. */
export function resetAll(): void {
  write({ ...EMPTY });
}

// --- cloud sync (Supabase) -------------------------------------------------
// The whole local snapshot is a single JSON blob, mirrored to one Supabase row
// so the same data follows Matthew across devices. See SyncProvider + /api/state.

export function exportState(): unknown {
  return read();
}

export function importState(data: unknown): void {
  if (typeof window === "undefined" || !data || typeof data !== "object") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent("baseline:change"));
  } catch {
    // ignore
  }
}
