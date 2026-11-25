import type { Meal, NutritionDay, NutritionTargets } from "@/lib/types";

/**
 * PLACEHOLDER nutrition. These are NOT a diet or a cut — they're generic
 * fuel-to-perform numbers for a growing, active teenage athlete, shown only so
 * the dashboard has something real-looking. The AI research pass (Phase D) will
 * replace them with numbers personalized to Matthew. `placeholder: true` drives
 * the visible "AI will personalize this" state everywhere they're shown.
 */
export const PLACEHOLDER_TARGETS: NutritionTargets = {
  kcal: 2700,
  protein: 140,
  carbs: 330,
  fat: 80,
  waterMl: 3000,
  placeholder: true,
};

/** Sample meals so the Nutrition page isn't empty. Clearly AI-planned placeholders. */
export const SAMPLE_MEALS: Meal[] = [
  { id: "sample-b", name: "Oats, banana, milk & peanut butter", slot: "breakfast", kcal: 620, protein: 28, carbs: 82, fat: 20, planned: true },
  { id: "sample-l", name: "Rice, chicken & kimchi bowl", slot: "lunch", kcal: 780, protein: 48, carbs: 92, fat: 20, planned: true },
  { id: "sample-s", name: "Greek yogurt & berries", slot: "snack", kcal: 300, protein: 22, carbs: 34, fat: 8, planned: true },
  { id: "sample-d", name: "Salmon, sweet potato & greens", slot: "dinner", kcal: 700, protein: 45, carbs: 60, fat: 28, planned: true },
];

export function sumMacros(meals: Meal[]): { kcal: number; protein: number; carbs: number; fat: number } {
  return meals.reduce(
    (acc, m) => ({
      kcal: acc.kcal + m.kcal,
      protein: acc.protein + m.protein,
      carbs: acc.carbs + m.carbs,
      fat: acc.fat + m.fat,
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

export function emptyDay(dateISO: string): NutritionDay {
  return { dateISO, meals: [], waterMl: 0 };
}
