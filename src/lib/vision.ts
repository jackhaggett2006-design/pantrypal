import Anthropic from "@anthropic-ai/sdk";
import { FOOD_CATEGORIES } from "@/lib/food-icons";
import type { RecognizedFood, FoodCategory } from "@/lib/types";

/**
 * Uses Claude vision to read a photo of a receipt or groceries and return a
 * structured list of food items. Model choice (claude-sonnet-5) balances
 * capability against the pay-per-use cost.
 */

let client: Anthropic | null = null;
function getClient() {
  client ??= new Anthropic(); // reads ANTHROPIC_API_KEY from the environment
  return client;
}

const MEDIA_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

const foodSchema = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Concise food name, e.g. 'banana' or 'chicken breast'",
          },
          emoji: {
            type: "string",
            description: "A single food emoji that best represents this item",
          },
          quantity: {
            type: "number",
            description: "Quantity if visible, otherwise 1",
          },
          unit: {
            type: "string",
            description: "Unit such as 'unit', 'g', 'ml', 'pack'; default 'unit'",
          },
          category: { type: "string", enum: FOOD_CATEGORIES },
        },
        required: ["name", "emoji", "quantity", "unit", "category"],
        additionalProperties: false,
      },
    },
  },
  required: ["items"],
  additionalProperties: false,
} as const;

type VisionItem = {
  name: string;
  emoji: string;
  quantity: number;
  unit: string;
  category: FoodCategory;
};

export type RecognizedItem = RecognizedFood & { emoji: string };

export async function recognizeFoods(
  base64: string,
  mediaType: string,
): Promise<RecognizedItem[]> {
  const media = MEDIA_TYPES.has(mediaType) ? mediaType : "image/jpeg";

  const response = await getClient().messages.create(
    {
      model: "claude-sonnet-5",
      max_tokens: 4096,
      thinking: { type: "disabled" },
      output_config: { format: { type: "json_schema", schema: foodSchema } },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: media as "image/jpeg",
                data: base64,
              },
            },
            {
              type: "text",
              text: "This is a photo of a grocery receipt or groceries on a surface. List every distinct food or drink item you can identify. Ignore non-food items, totals, store names, and prices. For each item give a concise name, a fitting single food emoji, a quantity (default 1), a unit (default 'unit'), and a category.",
            },
          ],
        },
      ],
    },
    { timeout: 30_000 },
  );

  const text = response.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") return [];

  try {
    const parsed = JSON.parse(text.text) as { items: VisionItem[] };
    return (parsed.items ?? []).map((it) => ({
      name: it.name,
      emoji: it.emoji,
      quantity: it.quantity ?? 1,
      unit: it.unit ?? "unit",
      category: it.category,
    }));
  } catch {
    return [];
  }
}

const foodTextSchema = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description:
              "Concise, USDA-searchable food name, e.g. 'scrambled egg' or 'whole wheat toast' — not a whole meal name",
          },
          grams: {
            type: "number",
            description:
              "Best-effort estimated weight in grams for the amount described (use typical serving sizes when no amount is given, e.g. one egg ≈ 50g)",
          },
        },
        required: ["name", "grams"],
        additionalProperties: false,
      },
    },
  },
  required: ["items"],
  additionalProperties: false,
} as const;

export type ParsedFoodItem = { name: string; grams: number };

/** Parses a freeform description of a meal ("2 eggs and toast with butter")
 * into distinct, USDA-searchable food items with an estimated gram weight
 * each — the text-input sibling of `recognizeFoods` above. */
export async function parseFoodText(description: string): Promise<ParsedFoodItem[]> {
  const response = await getClient().messages.create(
    {
      model: "claude-sonnet-5",
      max_tokens: 1024,
      thinking: { type: "disabled" },
      output_config: { format: { type: "json_schema", schema: foodTextSchema } },
      messages: [
        {
          role: "user",
          content: `Break this food diary entry into distinct food items with an estimated weight in grams each: "${description}"`,
        },
      ],
    },
    { timeout: 20_000 },
  );

  const text = response.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") return [];

  try {
    const parsed = JSON.parse(text.text) as { items: ParsedFoodItem[] };
    return (parsed.items ?? []).filter((it) => it.name && it.grams > 0);
  } catch {
    return [];
  }
}

const mealPhotoSchema = {
  type: "object",
  properties: {
    name: { type: "string", description: "Short name for the plate, e.g. 'Grilled chicken with rice'" },
    calories: { type: "number" },
    protein_g: { type: "number" },
    carbs_g: { type: "number" },
    fat_g: { type: "number" },
  },
  required: ["name", "calories", "protein_g", "carbs_g", "fat_g"],
  additionalProperties: false,
} as const;

export type MealEstimate = {
  name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
};

/** Estimates macros for a whole plated meal directly from a photo — unlike
 * `recognizeFoods` (which lists raw ingredients for the pantry), this reasons
 * about a cooked dish holistically since there's no per-ingredient USDA
 * lookup that fits "half a plate of pasta with sauce". */
export async function recognizeMeal(
  base64: string,
  mediaType: string,
): Promise<MealEstimate | null> {
  const media = MEDIA_TYPES.has(mediaType) ? mediaType : "image/jpeg";

  const response = await getClient().messages.create(
    {
      model: "claude-sonnet-5",
      max_tokens: 1024,
      thinking: { type: "disabled" },
      output_config: { format: { type: "json_schema", schema: mealPhotoSchema } },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: media as "image/jpeg", data: base64 },
            },
            {
              type: "text",
              text: "This is a photo of a plated meal. Estimate the calories, protein, carbs, and fat for the whole portion shown, and give the dish a short name.",
            },
          ],
        },
      ],
    },
    { timeout: 30_000 },
  );

  const text = response.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") return null;

  try {
    return JSON.parse(text.text) as MealEstimate;
  } catch {
    return null;
  }
}
