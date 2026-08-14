import type { Macros } from "@/lib/types";

/** Scale per-100g macros to an actual gram quantity eaten. */
export function scaleMacros(per100g: Macros, grams: number): Macros {
  const factor = grams / 100;
  return {
    calories: Math.round(per100g.calories * factor),
    protein_g: Math.round(per100g.protein_g * factor * 10) / 10,
    carbs_g: Math.round(per100g.carbs_g * factor * 10) / 10,
    fat_g: Math.round(per100g.fat_g * factor * 10) / 10,
  };
}

export function sumMacros(entries: Macros[]): Macros {
  return entries.reduce(
    (acc, m) => ({
      calories: acc.calories + m.calories,
      protein_g: acc.protein_g + m.protein_g,
      carbs_g: acc.carbs_g + m.carbs_g,
      fat_g: acc.fat_g + m.fat_g,
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
  );
}

/** Today's date in UTC, matching the DB default for `intake_log.logged_on`. */
export function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";
export type GoalDirection = "lose" | "maintain" | "gain";

const ACTIVITY_MULTIPLIER: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const GOAL_ADJUSTMENT_KCAL: Record<GoalDirection, number> = {
  lose: -500,
  maintain: 0,
  gain: 300,
};

/**
 * Estimate a daily calorie + macro target from basic biometrics, for
 * onboarding's "help me estimate" path. Mifflin-St Jeor for BMR, scaled by
 * activity level, then a balanced 30/40/30 protein/carb/fat split — a
 * reasonable starting point the user can always edit before saving.
 */
export function estimateGoals(input: {
  sex: "male" | "female";
  age: number;
  heightCm: number;
  weightKg: number;
  activity: ActivityLevel;
  goal: GoalDirection;
}): Macros {
  const { sex, age, heightCm, weightKg, activity, goal } = input;
  const bmr =
    sex === "male"
      ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
      : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  const tdee = bmr * ACTIVITY_MULTIPLIER[activity];
  const calories = Math.max(
    1200,
    Math.round((tdee + GOAL_ADJUSTMENT_KCAL[goal]) / 10) * 10,
  );

  return {
    calories,
    protein_g: Math.round((calories * 0.3) / 4),
    carbs_g: Math.round((calories * 0.4) / 4),
    fat_g: Math.round((calories * 0.3) / 9),
  };
}
