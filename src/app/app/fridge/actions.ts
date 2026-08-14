"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { recognizeFoods } from "@/lib/vision";
import { lookupNutrition } from "@/lib/usda";
import { resolveFoodIcon } from "@/lib/food-icons";
import type { FoodCategory, Macros } from "@/lib/types";

export type DraftItem = {
  name: string;
  icon_key: string;
  quantity: number;
  unit: string;
  category: FoodCategory;
  fdc_id: number | null;
  macros_per_100g: Macros | null;
  expires_at: string | null;
};

export type AnalyzeResult =
  | { ok: true; items: DraftItem[] }
  | { ok: false; error: string };

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, user };
}

/**
 * Analyze an uploaded photo: run vision recognition, then enrich each item
 * with a food icon and USDA macros. Nothing is saved yet — the client shows a
 * confirmation screen and calls savePantryItems with the (possibly edited) list.
 */
export async function analyzePhoto(formData: FormData): Promise<AnalyzeResult> {
  try {
    const { user, supabase } = await requireUser();
    const file = formData.get("photo");
    if (!(file instanceof File) || file.size === 0) {
      return { ok: false, error: "No photo provided." };
    }
    if (file.size > 10 * 1024 * 1024) {
      return { ok: false, error: "Photo is too large (max 10MB)." };
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const base64 = bytes.toString("base64");

    // Best-effort: keep the original photo in private storage for history.
    void supabase.storage
      .from("food-photos")
      .upload(`${user.id}/${Date.now()}-${file.name || "photo.jpg"}`, bytes, {
        contentType: file.type || "image/jpeg",
        upsert: false,
      });

    const recognized = await recognizeFoods(base64, file.type || "image/jpeg");
    if (recognized.length === 0) {
      return { ok: false, error: "Couldn't find any food in that photo." };
    }

    const items = await Promise.all(
      recognized.map(async (it): Promise<DraftItem> => {
        const nutrition = await lookupNutrition(it.name);
        return {
          name: it.name,
          icon_key: resolveFoodIcon(it.emoji, it.category),
          quantity: it.quantity ?? 1,
          unit: it.unit ?? "unit",
          category: it.category,
          fdc_id: nutrition.fdcId,
          macros_per_100g: nutrition.macrosPer100g,
          expires_at: null, // not inferred from photos; set manually if needed
        };
      }),
    );

    return { ok: true, items };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Analysis failed." };
  }
}

/** Persist a confirmed list of items to the pantry. */
export async function savePantryItems(
  items: DraftItem[],
  source: "receipt" | "photo" | "manual" = "photo",
) {
  const { supabase, user } = await requireUser();
  if (items.length === 0) return;

  const rows = items.map((it) => ({
    user_id: user.id,
    name: it.name,
    icon_key: it.icon_key,
    quantity: it.quantity,
    unit: it.unit,
    category: it.category,
    fdc_id: it.fdc_id,
    macros_per_100g: it.macros_per_100g,
    expires_at: it.expires_at,
    source,
  }));

  const { error } = await supabase.from("pantry_items").insert(rows);
  if (error) throw new Error(error.message);
  revalidatePath("/app/fridge");
}

/** Add a single item by hand, enriching it with an icon and USDA macros. */
export async function addManualItem(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const category = (String(formData.get("category") ?? "other") ||
    "other") as FoodCategory;
  const quantity = Number(formData.get("quantity") ?? 1) || 1;
  const unit = String(formData.get("unit") ?? "unit").trim() || "unit";
  const expiresAt = String(formData.get("expires_at") ?? "").trim() || null;
  if (!name) return;

  const nutrition = await lookupNutrition(name);
  await savePantryItems(
    [
      {
        name,
        icon_key: resolveFoodIcon(null, category),
        quantity,
        unit,
        category,
        fdc_id: nutrition.fdcId,
        macros_per_100g: nutrition.macrosPer100g,
        expires_at: expiresAt,
      },
    ],
    "manual",
  );
}

export async function deletePantryItem(id: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("pantry_items").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/app/fridge");
}
