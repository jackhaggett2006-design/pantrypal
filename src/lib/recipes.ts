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

  const response = await getClient().messages.create({
    model: "claude-sonnet-5",
    max_tokens: 8192,
    thinking: { type: "disabled" },
    output_config: { format: { type: "json_schema", schema: recipeSchema } },
    messages: [
      {
        role: "user",
        content: `Here is what's currently in my fridge/pantry:\n${ingredientList}\n\nSuggest 3 different recipes I could cook using mainly these ingredients. You may assume basic staples are available even if not listed (salt, pepper, cooking oil, water). Prefer recipes that use as many of the listed ingredients as possible and minimize extra items I'd need to buy. For each recipe give a short appetizing title, a fitting emoji, a one-sentence description, servings, a full ingredient list with realistic quantities, clear step-by-step instructions (mark any step that involves a wait, like baking or simmering, with its duration in minutes), and your best estimate of the macros per serving.`,
      },
    ],
  });

  const text = response.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") return [];

  try {
    const parsed = JSON.parse(text.text) as { recipes: RecipeIdea[] };
    return parsed.recipes ?? [];
  } catch {
    return [];
  }
}
