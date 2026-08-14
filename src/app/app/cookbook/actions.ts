"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { generateRecipeIdeas, rankRecipesForNow, type RankableRecipe } from "@/lib/recipes";
import { computeMatch } from "@/lib/recipe-match";
import { sumMacros, todayUtc } from "@/lib/macros";
import type { Macros, RecipeStep } from "@/lib/types";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, user };
}

export type GenerateResult =
  | { ok: true; count: number }
  | { ok: false; error: string };

/** Generate recipe ideas from the current pantry and save them to the cookbook. */
export async function generateRecipes(): Promise<GenerateResult> {
  try {
    const { supabase, user } = await requireUser();
    const { data: pantryRows } = await supabase
      .from("pantry_items")
      .select("name, quantity, unit")
      .order("added_at", { ascending: false });

    const pantry = pantryRows ?? [];
    if (pantry.length === 0) {
      return { ok: false, error: "Add some items to your pantry first." };
    }

    const ideas = await generateRecipeIdeas(pantry);
    if (ideas.length === 0) {
      return { ok: false, error: "Couldn't come up with recipes right now — try again." };
    }

    for (const idea of ideas) {
      const { data: recipe, error } = await supabase
        .from("recipes")
        .insert({
          user_id: user.id,
          title: idea.title,
          description: idea.description,
          servings: idea.servings || 1,
          steps: idea.steps,
          macros: idea.macros_per_serving,
          source: "ai",
          image_url: idea.emoji, // short string = emoji icon, not a real URL (no image gen)
        })
        .select("id")
        .single();

      if (error || !recipe) continue;

      if (idea.ingredients.length > 0) {
        await supabase.from("recipe_ingredients").insert(
          idea.ingredients.map((ing) => ({
            recipe_id: recipe.id,
            name: ing.name,
            quantity: ing.quantity,
            unit: ing.unit,
          })),
        );
      }
    }

    revalidatePath("/app/cookbook");
    return { ok: true, count: ideas.length };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Generation failed." };
  }
}

/** Manually create a recipe (one ingredient / one step per line). */
export async function createUserRecipe(formData: FormData) {
  const { supabase, user } = await requireUser();

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;
  const description = String(formData.get("description") ?? "").trim() || null;
  const servings = Number(formData.get("servings") ?? 1) || 1;
  const emoji = String(formData.get("emoji") ?? "").trim() || "🍽️";

  const ingredients = String(formData.get("ingredients") ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const steps: RecipeStep[] = String(formData.get("steps") ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((text) => ({ text }));

  const { data: recipe, error } = await supabase
    .from("recipes")
    .insert({
      user_id: user.id,
      title,
      description,
      servings,
      steps,
      macros: null,
      source: "user",
      image_url: emoji,
    })
    .select("id")
    .single();

  if (error || !recipe) throw new Error(error?.message ?? "Couldn't save recipe.");

  if (ingredients.length > 0) {
    await supabase.from("recipe_ingredients").insert(
      ingredients.map((name) => ({ recipe_id: recipe.id, name, quantity: null, unit: null })),
    );
  }

  revalidatePath("/app/cookbook");
}

export type Recommendation = { recipeId: string; reason: string };
export type RecommendResult =
  | { ok: true; recommendation: Recommendation; rankedIds: string[] }
  | { ok: false; error: string };

const DEFAULT_GOALS = { calories: 2000, protein_g: 150, carbs_g: 200, fat_g: 65 };

function timeOfDayLabel(): string {
  const hour = new Date().getHours();
  if (hour < 10) return "morning (breakfast time)";
  if (hour < 15) return "midday (lunch time)";
  if (hour < 17) return "afternoon";
  if (hour < 21) return "evening (dinner time)";
  return "late at night";
}

/** Ranks the user's cookbook for "what should I eat right now": remaining
 * macro budget today, current time of day, and how often they've cooked
 * each recipe before (a proxy for what they actually like). */
export async function getRecommendation(): Promise<RecommendResult> {
  const { supabase, user } = await requireUser();

  const [{ data: recipeRows }, { data: pantryRows }, { data: goalsRow }, { data: intakeRows }] =
    await Promise.all([
      supabase.from("recipes").select("*, recipe_ingredients(*)").eq("user_id", user.id),
      supabase.from("pantry_items").select("name").eq("user_id", user.id),
      supabase.from("macro_goals").select("*").eq("user_id", user.id).maybeSingle(),
      supabase
        .from("intake_log")
        .select("food_name, source, calories, protein_g, carbs_g, fat_g, logged_on")
        .eq("user_id", user.id),
    ]);

  const recipes = recipeRows ?? [];
  if (recipes.length === 0) {
    return { ok: false, error: "Add some recipes to your cookbook first." };
  }

  const pantryNames = (pantryRows ?? []).map((p) => p.name.toLowerCase());
  const goals = (goalsRow as (Macros & { user_id: string }) | null) ?? {
    ...DEFAULT_GOALS,
    user_id: user.id,
  };

  const today = todayUtc();
  const allIntake = intakeRows ?? [];
  const todayTotals = sumMacros(
    allIntake.filter((r) => r.logged_on === today).map((r) => r),
  );
  const remaining: Macros = {
    calories: Math.max(0, goals.calories - todayTotals.calories),
    protein_g: Math.max(0, goals.protein_g - todayTotals.protein_g),
    carbs_g: Math.max(0, goals.carbs_g - todayTotals.carbs_g),
    fat_g: Math.max(0, goals.fat_g - todayTotals.fat_g),
  };

  const cookedCount = new Map<string, number>();
  for (const row of allIntake) {
    if (row.source !== "recipe") continue;
    const key = row.food_name.trim().toLowerCase();
    cookedCount.set(key, (cookedCount.get(key) ?? 0) + 1);
  }

  const rankable: RankableRecipe[] = recipes.map((r, i) => {
    const match = computeMatch(r.recipe_ingredients ?? [], pantryNames);
    return {
      index: i + 1,
      title: r.title,
      description: r.description,
      macros: r.macros as Macros | null,
      ingredientsHave: match.have,
      ingredientsTotal: match.total,
      timesCooked: cookedCount.get(r.title.trim().toLowerCase()) ?? 0,
    };
  });

  const result = await rankRecipesForNow(rankable, remaining, timeOfDayLabel());
  if (!result) {
    return { ok: false, error: "Couldn't put together a recommendation — try again." };
  }

  const idByIndex = new Map(rankable.map((r) => [r.index, recipes[r.index - 1].id as string]));
  const rankedIds = result.rankedIndices
    .map((i) => idByIndex.get(i))
    .filter((id): id is string => Boolean(id));

  if (rankedIds.length === 0) {
    return { ok: false, error: "Couldn't put together a recommendation — try again." };
  }

  return {
    ok: true,
    recommendation: { recipeId: rankedIds[0], reason: result.reason },
    rankedIds,
  };
}

export async function deleteRecipe(id: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("recipes").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/app/cookbook");
}
