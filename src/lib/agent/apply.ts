import type { AddonSourceKind, CalendarEvent } from "@/lib/types";
import {
  addAddon,
  addMemories,
  addMetric,
  defaultCheckin,
  getAiSettings,
  getNutritionTargets,
  listMemory,
  listMetrics,
  loadCheckin,
  loadProfile,
  saveCheckin,
  saveEvents,
  saveProfile,
  setNutritionTargets,
  todayISO,
} from "@/lib/store";
import { defaultProfile } from "@/lib/defaults";
import type { AgentSnapshot, AgentUpdates } from "./schema";

/** Snapshot of everything the agent needs as context. */
export function buildSnapshot(): AgentSnapshot {
  const profile = loadProfile() ?? defaultProfile(new Date().toISOString());
  return {
    profile,
    memory: listMemory().map((m) => m.text),
    nutrition: getNutritionTargets(),
    recentMetrics: listMetrics()
      .slice(-12)
      .map((m) => ({ key: m.key, value: m.value, dateISO: m.dateISO })),
    todayISO: todayISO(),
  };
}

export function agentModel(): string {
  return getAiSettings().model;
}

/** Where a `workout` addon came from. Required whenever the updates carry one. */
export interface AddonSource {
  kind: AddonSourceKind;
  label: string;
}

/** Apply the agent's validated updates to the local store. Returns a list of what changed. */
export function applyUpdates(u: AgentUpdates, source?: AddonSource): string[] {
  const changed: string[] = [];
  const date = todayISO();

  if (u.memory?.length) {
    addMemories(u.memory.map((m) => ({ text: m.text, category: m.category, source: "ai" as const })));
    changed.push(`remembered ${u.memory.length}`);
  }

  if (u.metrics?.length) {
    u.metrics.forEach((m) => addMetric(date, m.key, m.value));
    changed.push(`logged ${u.metrics.length} metric${u.metrics.length > 1 ? "s" : ""}`);
  }

  if (u.profile && Object.keys(u.profile).length) {
    const p = loadProfile();
    if (p) {
      const goalWeights = u.profile.goalWeights
        ? { ...p.goalWeights, ...u.profile.goalWeights }
        : p.goalWeights;
      saveProfile({ ...p, ...u.profile, goalWeights });
      changed.push("updated profile");
    }
  }

  if (u.nutrition && Object.keys(u.nutrition).length) {
    const t = getNutritionTargets();
    setNutritionTargets({ ...t, ...u.nutrition, placeholder: false });
    changed.push("updated fuel");
  }

  if (u.checkin && Object.keys(u.checkin).length) {
    const existing = loadCheckin(date) ?? defaultCheckin(date);
    const { tennis, ...rest } = u.checkin;
    saveCheckin({ ...existing, ...rest });
    if (tennis) {
      const events: CalendarEvent[] =
        tennis === "practice"
          ? [{ title: "Tennis practice", kind: "tennis_practice" }]
          : tennis === "match"
            ? [{ title: "Tennis match", kind: "tennis_match" }]
            : [];
      saveEvents(date, events);
    }
    changed.push("tuned today");
  }

  // Only the video route produces these, and only with a source to attribute it to.
  if (u.workout && source) {
    addAddon({
      dateISO: date,
      title: u.workout.title,
      intent: u.workout.intent,
      exercises: u.workout.exercises,
      sourceKind: source.kind,
      sourceLabel: source.label,
    });
    changed.push(`added ${u.workout.exercises.length} moves to today`);
  }

  return changed;
}
