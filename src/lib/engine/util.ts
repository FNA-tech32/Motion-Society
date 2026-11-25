/** Small pure helpers for the engine. No clock, no randomness — fully deterministic. */

export function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** FNV-1a hash of a string → unsigned 32-bit int. Used to vary picks by day. */
export function seedFromString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Whole days since the Unix epoch for a YYYY-MM-DD (or full ISO) date. */
export function dayIndex(dateISO: string): number {
  const iso = dateISO.length <= 10 ? `${dateISO}T00:00:00.000Z` : dateISO;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? 0 : Math.floor(t / 86_400_000);
}

/** Rotate an array left by `by` (deterministic; used with a per-day seed). */
export function rotate<T>(items: T[], by: number): T[] {
  if (items.length === 0) return items;
  const n = ((by % items.length) + items.length) % items.length;
  return items.slice(n).concat(items.slice(0, n));
}
