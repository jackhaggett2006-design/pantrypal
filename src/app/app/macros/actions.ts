"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { lookupNutrition } from "@/lib/usda";
import { scaleMacros } from "@/lib/macros";
import { parseFoodText, recognizeMeal, type ParsedFoodItem, type MealEstimate } from "@/lib/vision";
import type { IntakeEntry, Macros } from "@/lib/types";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, user };
}

/** Create or update the user's macro goals (one row per user). */
export async function saveGoals(formData: FormData) {
  const { supabase, user } = await requireUser();

  const num = (key: string, fallback: number) => {
    const v = Number(formData.get(key));
    return Number.isFinite(v) && v > 0 ? Math.round(v) : fallback;
  };

  const { error } = await supabase.from("macro_goals").upsert(
    {
      user_id: user.id,
      calories: num("calories", 2000),
      protein_g: num("protein_g", 150),
      carbs_g: num("carbs_g", 200),
      fat_g: num("fat_g", 65),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) throw new Error(error.message);
  revalidatePath("/app/macros");
}

async function insertIntake(
  user_id: string,
  food_name: string,
  quantity: number,
  unit: string,
  macros: Macros,
  source: "pantry" | "manual" | "recipe",
) {
  const supabase = await createClient();
  const { error } = await supabase.from("intake_log").insert({
    user_id,
    food_name,
    quantity,
    unit,
    calories: macros.calories,
    protein_g: macros.protein_g,
    carbs_g: macros.carbs_g,
    fat_g: macros.fat_g,
    source,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/app/macros");
}

/** Log an amount of an existing pantry item, scaled to grams eaten. */
export async function logFromPantry(formData: FormData) {
  const { supabase, user } = await requireUser();
  const pantryItemId = String(formData.get("pantryItemId") ?? "");
  const grams = Number(formData.get("grams") ?? 0);
  if (!pantryItemId || !grams || grams <= 0) return;

  const { data: item, error } = await supabase
    .from("pantry_items")
    .select("name, macros_per_100g")
    .eq("id", pantryItemId)
    .single();
  if (error || !item) throw new Error("Couldn't find that pantry item.");

  const per100g = (item.macros_per_100g as Macros | null) ?? {
    calories: 0,
    protein_g: 0,
    carbs_g: 0,
    fat_g: 0,
  };

  await insertIntake(
    user.id,
    item.name,
    grams,
    "g",
    scaleMacros(per100g, grams),
    "pantry",
  );
}

/** Log a food by name (USDA lookup), scaled to grams eaten. */
export async function logManual(formData: FormData) {
  const { user } = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const grams = Number(formData.get("grams") ?? 0);
  if (!name || !grams || grams <= 0) return;

  const nutrition = await lookupNutrition(name);
  const per100g = nutrition.macrosPer100g ?? {
    calories: 0,
    protein_g: 0,
    carbs_g: 0,
    fat_g: 0,
  };

  await insertIntake(user.id, name, grams, "g", scaleMacros(per100g, grams), "manual");
}

/** Log N servings of a recipe (its per-serving macro estimate x servings). */
export async function logRecipe(formData: FormData) {
  const { supabase, user } = await requireUser();
  const recipeId = String(formData.get("recipeId") ?? "");
  const servings = Number(formData.get("servings") ?? 1) || 1;
  if (!recipeId) return;

  const { data: recipe, error } = await supabase
    .from("recipes")
    .select("title, macros")
    .eq("id", recipeId)
    .single();
  if (error || !recipe) throw new Error("Couldn't find that recipe.");

  const perServing = recipe.macros as Macros | null;
  if (!perServing) {
    throw new Error("This recipe doesn't have macro estimates yet.");
  }

  const totals: Macros = {
    calories: Math.round(perServing.calories * servings),
    protein_g: Math.round(perServing.protein_g * servings * 10) / 10,
    carbs_g: Math.round(perServing.carbs_g * servings * 10) / 10,
    fat_g: Math.round(perServing.fat_g * servings * 10) / 10,
  };

  await insertIntake(user.id, recipe.title, servings, " serving(s)", totals, "recipe");
}

/** Parse a freeform meal description ("2 eggs and toast") into editable
 * draft food items, without logging anything yet. */
export async function parseFreeformFood(
  description: string,
): Promise<{ ok: true; items: ParsedFoodItem[] } | { ok: false; error: string }> {
  await requireUser();
  const trimmed = description.trim();
  if (!trimmed) return { ok: false, error: "Describe what you ate first." };

  const items = await parseFoodText(trimmed);
  if (items.length === 0) {
    return { ok: false, error: "Couldn't make sense of that — try rephrasing." };
  }
  return { ok: true, items };
}

/** Log a confirmed batch of freeform-parsed food items (USDA lookup per item). */
export async function logFreeformItems(items: ParsedFoodItem[]) {
  const { user } = await requireUser();
  const valid = items.filter((it) => it.name.trim() && it.grams > 0);
  if (valid.length === 0) return;

  for (const item of valid) {
    const nutrition = await lookupNutrition(item.name);
    const per100g = nutrition.macrosPer100g ?? {
      calories: 0,
      protein_g: 0,
      carbs_g: 0,
      fat_g: 0,
    };
    await insertIntake(
      user.id,
      item.name,
      item.grams,
      "g",
      scaleMacros(per100g, item.grams),
      "manual",
    );
  }
}

export type RecentMeal = {
  food_name: string;
  quantity: number | null;
  unit: string | null;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  times_logged: number;
  last_logged_at: string;
};

/** Meals the user has logged before, deduped by name and ranked by how often
 * (then how recently) they've had it — powers the quick "meal you've had"
 * picker so re-logging a regular is a single tap. */
export async function getRecentMeals(): Promise<RecentMeal[]> {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("intake_log")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(300);
  if (error || !data) return [];

  const byName = new Map<string, RecentMeal>();
  for (const row of data as IntakeEntry[]) {
    const key = row.food_name.trim().toLowerCase();
    const existing = byName.get(key);
    if (existing) {
      existing.times_logged += 1;
      continue;
    }
    byName.set(key, {
      food_name: row.food_name,
      quantity: row.quantity,
      unit: row.unit,
      calories: row.calories,
      protein_g: row.protein_g,
      carbs_g: row.carbs_g,
      fat_g: row.fat_g,
      times_logged: 1,
      last_logged_at: row.created_at,
    });
  }

  return Array.from(byName.values())
    .sort(
      (a, b) =>
        b.times_logged - a.times_logged ||
        new Date(b.last_logged_at).getTime() - new Date(a.last_logged_at).getTime(),
    )
    .slice(0, 15);
}

/** Re-log a meal exactly as it was logged before — same quantity and macros. */
export async function logPastMeal(meal: RecentMeal) {
  const { user } = await requireUser();
  await insertIntake(
    user.id,
    meal.food_name,
    meal.quantity ?? 1,
    meal.unit ?? "unit",
    {
      calories: meal.calories,
      protein_g: meal.protein_g,
      carbs_g: meal.carbs_g,
      fat_g: meal.fat_g,
    },
    "manual",
  );
}

/** Estimate macros for a photographed plate, without logging anything yet. */
export async function analyzeMealPhoto(
  formData: FormData,
): Promise<{ ok: true; estimate: MealEstimate } | { ok: false; error: string }> {
  await requireUser();
  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "No photo provided." };
  }
  if (file.size > 10 * 1024 * 1024) {
    return { ok: false, error: "Photo is too large (max 10MB)." };
  }

  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    const estimate = await recognizeMeal(bytes.toString("base64"), file.type || "image/jpeg");
    if (!estimate) {
      return { ok: false, error: "Couldn't make out a meal in that photo." };
    }
    return { ok: true, estimate };
  } catch {
    return { ok: false, error: "Something went wrong reading that photo — try again." };
  }
}

/** Log a confirmed (and possibly user-edited) photo-derived meal estimate. */
export async function logMealEstimate(estimate: MealEstimate) {
  const { user } = await requireUser();
  await insertIntake(
    user.id,
    estimate.name || "Meal",
    1,
    "plate",
    {
      calories: estimate.calories,
      protein_g: estimate.protein_g,
      carbs_g: estimate.carbs_g,
      fat_g: estimate.fat_g,
    },
    "manual",
  );
}

export async function deleteIntakeEntry(id: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("intake_log").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/app/macros");
}
