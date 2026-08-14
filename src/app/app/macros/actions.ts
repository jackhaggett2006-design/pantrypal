"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { lookupNutrition } from "@/lib/usda";
import { scaleMacros } from "@/lib/macros";
import type { Macros } from "@/lib/types";

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

export async function deleteIntakeEntry(id: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("intake_log").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/app/macros");
}
