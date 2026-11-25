import type { CalendarEvent, Checkin, DayContext, SorenessArea } from "@/lib/types";
import { clamp01, round2 } from "./util";

/** Distilled read of "what today is like" — the input to session selection. */
export interface DayFlags {
  tennis: "match" | "practice" | "none";
  schoolLoad: boolean;
  freeMinutes: number;
  /** 0..1 composite of energy, sleep, and (inverted) soreness. */
  readiness: number;
  soreness: number;
  soreAreas: SorenessArea[];
}

/**
 * Composite readiness. Energy leads, sleep close behind, soreness pulls down.
 * A fully fresh day → ~1.0; wiped out and sore → ~0.0.
 */
export function computeReadiness(checkin: Checkin): number {
  const energy = clamp01((checkin.energy - 1) / 4);
  const sleep = clamp01((checkin.sleepQuality - 1) / 4);
  const sore = clamp01(checkin.soreness / 5);
  return round2(clamp01(energy * 0.4 + sleep * 0.35 + (1 - sore) * 0.25));
}

function detectTennis(events: CalendarEvent[]): DayFlags["tennis"] {
  if (events.some((e) => e.kind === "tennis_match")) return "match";
  if (events.some((e) => e.kind === "tennis_practice")) return "practice";
  return "none";
}

export function readDay(ctx: DayContext): DayFlags {
  return {
    tennis: detectTennis(ctx.events),
    schoolLoad: ctx.events.some((e) => e.kind === "school" || e.kind === "busy"),
    freeMinutes: Math.max(0, Math.round(ctx.checkin.minutesAvailable)),
    readiness: computeReadiness(ctx.checkin),
    soreness: Math.max(0, Math.min(5, ctx.checkin.soreness)),
    soreAreas: ctx.checkin.soreAreas,
  };
}
