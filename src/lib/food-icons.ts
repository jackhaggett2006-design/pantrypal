import type { FoodCategory } from "@/lib/types";

/**
 * Curated food-icon set. The vision model picks a food emoji per item; we
 * validate it and fall back to a per-category emoji when it's missing or not a
 * recognizable food glyph. Emoji give a consistent, free, instant "fridge" look.
 */

const CATEGORY_FALLBACK: Record<FoodCategory, string> = {
  produce: "🥬",
  dairy: "🥛",
  meat: "🥩",
  seafood: "🐟",
  bakery: "🍞",
  pantry: "🥫",
  frozen: "🧊",
  beverage: "🥤",
  condiment: "🧂",
  other: "🍽️",
};

// A compact allow-set of common food emoji. If the model returns one of these
// we trust it; otherwise we fall back to the category default.
const KNOWN_FOOD_EMOJI = new Set([
  "🍎","🍏","🍐","🍊","🍋","🍌","🍉","🍇","🍓","🫐","🍈","🍒","🍑","🥭","🍍","🥥",
  "🥝","🍅","🍆","🥑","🥦","🥬","🥒","🌶️","🫑","🌽","🥕","🫒","🧄","🧅","🥔","🍠",
  "🥐","🥯","🍞","🥖","🥨","🧀","🥚","🍳","🧈","🥞","🧇","🥓","🥩","🍗","🍖","🌭",
  "🍔","🍟","🍕","🥪","🥙","🧆","🌮","🌯","🫔","🥗","🥘","🫕","🥫","🍝","🍜","🍲",
  "🍛","🍣","🍱","🥟","🦪","🍤","🍙","🍚","🍘","🍥","🥠","🥮","🍢","🍡","🍧","🍨",
  "🍦","🥧","🧁","🍰","🎂","🍮","🍭","🍬","🍫","🍿","🍩","🍪","🌰","🥜","🫘","🍯",
  "🥛","🍼","🫖","☕","🍵","🧃","🥤","🧋","🍶","🍺","🍻","🥂","🍷","🥃","🍸","🍹",
  "🐟","🐠","🐡","🦐","🦞","🦀","🦑","🐙","🍽️","🧊","🧂","🥣","🫙",
]);

export function resolveFoodIcon(
  emoji: string | null | undefined,
  category: FoodCategory | null | undefined,
): string {
  const cleaned = (emoji ?? "").trim();
  if (cleaned && KNOWN_FOOD_EMOJI.has(cleaned)) {
    return cleaned;
  }
  return CATEGORY_FALLBACK[category ?? "other"] ?? CATEGORY_FALLBACK.other;
}

export const FOOD_CATEGORIES: FoodCategory[] = [
  "produce",
  "dairy",
  "meat",
  "seafood",
  "bakery",
  "pantry",
  "frozen",
  "beverage",
  "condiment",
  "other",
];
