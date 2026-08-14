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

/** Soft pastel gradient per category, used to give fridge items some
 * physical presence instead of flat white cards. */
export const CATEGORY_TINT: Record<FoodCategory, [string, string]> = {
  produce: ["#E1EDD1", "#BCD79E"],
  dairy: ["#F5F0E3", "#E6D9BE"],
  meat: ["#F2D8CE", "#E0AD97"],
  seafood: ["#DBEAEA", "#AFD1D1"],
  bakery: ["#F3E3C6", "#E3C28C"],
  pantry: ["#F1E8D8", "#DDCBA6"],
  frozen: ["#DFEDF4", "#B3D4E4"],
  beverage: ["#EADFF1", "#CDB6E1"],
  condiment: ["#F6E6D6", "#E6C29B"],
  other: ["#EFECE5", "#DBD5C7"],
};

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
