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

// Warm, food-adjacent gradient pairs standing in for a photo — picked
// deterministically per recipe so a grid of cards reads as varied and
// appetizing rather than a single flat accent tile.
const HERO_GRADIENTS: [string, string][] = [
  ["#F3D9C0", "#E3A672"], // honey
  ["#DCE7C4", "#AFC98D"], // sage
  ["#F0D6D6", "#D9A3A0"], // tomato
  ["#D8E6E2", "#A7C4BC"], // sea foam
  ["#EDD9C0", "#CB8F5E"], // clay
  ["#E3DCEC", "#B9A6D1"], // plum
];

export function heroGradient(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  const [from, to] = HERO_GRADIENTS[hash % HERO_GRADIENTS.length];
  return `linear-gradient(135deg, ${from}, ${to})`;
}
