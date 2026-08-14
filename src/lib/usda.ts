import { createAdminClient } from "@/lib/supabase/admin";
import type { Macros } from "@/lib/types";

/**
 * Look up per-100g macros for a food name from USDA FoodData Central, backed by
 * a shared Postgres cache so a given food is only fetched once across all users.
 */

type UsdaNutrient = {
  nutrientNumber?: string;
  nutrientName?: string;
  unitName?: string;
  value?: number;
};

type UsdaFood = {
  fdcId: number;
  description: string;
  foodNutrients?: UsdaNutrient[];
};

// Classic USDA nutrient numbers (preserved by FoodData Central).
const NUTRIENT = { protein: "203", fat: "204", carbs: "205", energy: "208" };

function normalize(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

function extractMacros(food: UsdaFood): Macros {
  const by = (num: string) =>
    food.foodNutrients?.find((n) => n.nutrientNumber === num)?.value ?? 0;
  return {
    calories: Math.round(by(NUTRIENT.energy)),
    protein_g: Math.round(by(NUTRIENT.protein) * 10) / 10,
    carbs_g: Math.round(by(NUTRIENT.carbs) * 10) / 10,
    fat_g: Math.round(by(NUTRIENT.fat) * 10) / 10,
  };
}

export type NutritionResult = {
  fdcId: number | null;
  macrosPer100g: Macros | null;
};

export async function lookupNutrition(name: string): Promise<NutritionResult> {
  const key = normalize(name);
  const admin = createAdminClient();

  // 1. Shared cache by normalized name.
  const { data: cached } = await admin
    .from("nutrition_cache")
    .select("fdc_id, macros_per_100g")
    .eq("name", key)
    .maybeSingle();

  if (cached) {
    return {
      fdcId: cached.fdc_id as number,
      macrosPer100g: cached.macros_per_100g as Macros,
    };
  }

  // 2. USDA FoodData Central search (Foundation / SR Legacy are per-100g).
  const apiKey = process.env.USDA_API_KEY;
  if (!apiKey) return { fdcId: null, macrosPer100g: null };

  try {
    const url = new URL("https://api.nal.usda.gov/fdc/v1/foods/search");
    url.searchParams.set("query", name);
    url.searchParams.set("pageSize", "1");
    url.searchParams.set("dataType", "Foundation,SR Legacy,Survey (FNDDS)");
    url.searchParams.set("api_key", apiKey);

    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return { fdcId: null, macrosPer100g: null };

    const json = (await res.json()) as { foods?: UsdaFood[] };
    const food = json.foods?.[0];
    if (!food) return { fdcId: null, macrosPer100g: null };

    const macros = extractMacros(food);

    // 3. Write to the shared cache (service role bypasses RLS).
    await admin.from("nutrition_cache").upsert(
      { fdc_id: food.fdcId, name: key, macros_per_100g: macros },
      { onConflict: "fdc_id" },
    );

    return { fdcId: food.fdcId, macrosPer100g: macros };
  } catch {
    return { fdcId: null, macrosPer100g: null };
  }
}
