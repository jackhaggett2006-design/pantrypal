import type { RecipeIngredient } from "@/lib/types";

/** How many of a recipe's ingredients are already in the pantry (loose match). */
export function computeMatch(
  ingredients: RecipeIngredient[],
  pantryNames: string[],
): { have: number; total: number } {
  if (ingredients.length === 0) return { have: 0, total: 0 };
  const have = ingredients.filter((ing) => {
    const n = ing.name.toLowerCase();
    return pantryNames.some((p) => p.includes(n) || n.includes(p));
  }).length;
  return { have, total: ingredients.length };
}

/**
 * `image_url` doubles as a display icon: a short string is an emoji glyph
 * (no image generation — see design decision), anything longer is a real URL.
 */
export function isEmojiIcon(value: string | null | undefined): boolean {
  return !!value && value.length <= 4;
}
