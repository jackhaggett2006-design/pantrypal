import Anthropic from "@anthropic-ai/sdk";
import type { Macros, RecipeStep } from "@/lib/types";

/**
 * Uses Claude to generate recipe ideas constrained to the ingredients the user
 * actually has on hand. Macros are the model's best estimate for a composed
 * dish (unlike pantry items, which use real USDA data per ingredient).
 */

let client: Anthropic | null = null;
function getClient() {
  client ??= new Anthropic();
  return client;
}

export type RecipeIdea = {
  title: string;
  emoji: string;
  description: string;
  servings: number;
  ingredients: { name: string; quantity: number; unit: string }[];
  steps: RecipeStep[];
  macros_per_serving: Macros;
};

const recipeSchema = {
  type: "object",
  properties: {
    recipes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          emoji: {
            type: "string",
            description: "A single food emoji that represents this dish",
          },
          description: {
            type: "string",
            description: "One appetizing sentence describing the dish",
          },
          servings: { type: "number" },
          ingredients: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                quantity: { type: "number" },
                unit: { type: "string" },
              },
              required: ["name", "quantity", "unit"],
              additionalProperties: false,
            },
          },
          steps: {
            type: "array",
            items: {
              type: "object",
              properties: {
                text: { type: "string", description: "One clear instruction" },
                minutes: {
                  type: ["number", "null"],
                  description: "Timer for this step if it involves waiting, else null",
                },
              },
              required: ["text", "minutes"],
              additionalProperties: false,
            },
          },
          macros_per_serving: {
            type: "object",
            properties: {
              calories: { type: "number" },
              protein_g: { type: "number" },
              carbs_g: { type: "number" },
              fat_g: { type: "number" },
            },
            required: ["calories", "protein_g", "carbs_g", "fat_g"],
            additionalProperties: false,
          },
        },
        required: [
          "title",
          "emoji",
          "description",
          "servings",
          "ingredients",
          "steps",
          "macros_per_serving",
        ],
        additionalProperties: false,
      },
    },
  },
  required: ["recipes"],
  additionalProperties: false,
} as const;

export async function generateRecipeIdeas(
  pantry: { name: string; quantity: number | null; unit: string | null }[],
): Promise<RecipeIdea[]> {
  const ingredientList = pantry
    .map((p) => `- ${p.name}${p.quantity ? ` (${p.quantity}${p.unit ?? ""})` : ""}`)
    .join("\n");

  const response = await getClient().messages.create(
    {
      model: "claude-sonnet-5",
      max_tokens: 8192,
      thinking: { type: "disabled" },
      output_config: { format: { type: "json_schema", schema: recipeSchema } },
      messages: [
        {
          role: "user",
          content: `Here is what's currently in my pantry:\n${ingredientList}\n\nSuggest 3 different recipes I could cook using mainly these ingredients. You may assume basic staples are available even if not listed (salt, pepper, cooking oil, water). Prefer recipes that use as many of the listed ingredients as possible and minimize extra items I'd need to buy. For each recipe give a short appetizing title, a fitting emoji, a one-sentence description, servings, a full ingredient list with realistic quantities, clear step-by-step instructions (mark any step that involves a wait, like baking or simmering, with its duration in minutes), and your best estimate of the macros per serving.`,
        },
      ],
    },
    { timeout: 45_000 },
  );

  const text = response.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") return [];

  try {
    const parsed = JSON.parse(text.text) as { recipes: RecipeIdea[] };
    return parsed.recipes ?? [];
  } catch {
    return [];
  }
}

const rankSchema = {
  type: "object",
  properties: {
    ranked_indices: {
      type: "array",
      items: { type: "number" },
      description: "Every recipe number listed, best fit for right now first",
    },
    reason: {
      type: "string",
      description:
        "One short, specific sentence for why the #1 pick fits right now — mention the macro fit, the meal-time fit, or the preference signal, whichever is most relevant. Written for the person, not about the system.",
    },
  },
  required: ["ranked_indices", "reason"],
  additionalProperties: false,
} as const;

export type RankableRecipe = {
  index: number;
  title: string;
  description: string | null;
  macros: Macros | null;
  ingredientsHave: number;
  ingredientsTotal: number;
  timesCooked: number;
};

export type RankResult = { rankedIndices: number[]; reason: string };

/** Ranks the user's saved recipes for "what should I eat right now", using
 * remaining macro budget, time of day, and how often they've cooked each
 * recipe before as a stand-in for taste preference. */
export async function rankRecipesForNow(
  recipes: RankableRecipe[],
  remaining: Macros,
  timeOfDayLabel: string,
): Promise<RankResult | null> {
  if (recipes.length === 0) return null;

  const list = recipes
    .map(
      (r) =>
        `${r.index}. "${r.title}"${r.description ? ` — ${r.description}` : ""}\n` +
        `   macros/serving: ${r.macros ? `${Math.round(r.macros.calories)} kcal, ${r.macros.protein_g}g protein, ${r.macros.carbs_g}g carbs, ${r.macros.fat_g}g fat` : "unknown"}\n` +
        `   ingredients on hand: ${r.ingredientsHave}/${r.ingredientsTotal}\n` +
        `   cooked before: ${r.timesCooked} time(s)`,
    )
    .join("\n");

  const response = await getClient().messages.create(
    {
      model: "claude-sonnet-5",
      max_tokens: 1024,
      thinking: { type: "disabled" },
      output_config: { format: { type: "json_schema", schema: rankSchema } },
      messages: [
        {
          role: "user",
          content:
            `It's ${timeOfDayLabel}. I have ${Math.round(remaining.calories)} kcal, ${remaining.protein_g}g protein, ${remaining.carbs_g}g carbs, and ${remaining.fat_g}g fat left in my budget for the rest of today.\n\n` +
            `Here are my saved recipes:\n${list}\n\n` +
            `Rank all of them for "what should I eat right now" — weigh how well the macros fit what's left in my day, whether the dish suits this time of day, how many ingredients I already have, and recipes I've cooked more often (I probably like those). Pick a #1 and explain why in one short, specific sentence.`,
        },
      ],
    },
    { timeout: 25_000 },
  );

  const text = response.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") return null;

  try {
    const parsed = JSON.parse(text.text) as { ranked_indices: number[]; reason: string };
    if (!parsed.ranked_indices || parsed.ranked_indices.length === 0) return null;
    return { rankedIndices: parsed.ranked_indices, reason: parsed.reason };
  } catch {
    return null;
  }
}
