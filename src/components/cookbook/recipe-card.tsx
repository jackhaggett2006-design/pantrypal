"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Trash2, Sparkles, UserRound } from "lucide-react";
import { toast } from "sonner";
import { deleteRecipe } from "@/app/app/cookbook/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { computeMatch, isEmojiIcon } from "@/lib/recipe-match";
import type { Recipe, RecipeIngredient } from "@/lib/types";

type RecipeWithIngredients = Recipe & { recipe_ingredients: RecipeIngredient[] };

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

function heroGradient(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  const [from, to] = HERO_GRADIENTS[hash % HERO_GRADIENTS.length];
  return `linear-gradient(135deg, ${from}, ${to})`;
}

export function RecipeCard({
  recipe,
  pantryNames,
}: {
  recipe: RecipeWithIngredients;
  pantryNames: string[];
}) {
  const [pending, startTransition] = useTransition();
  const match = computeMatch(recipe.recipe_ingredients, pantryNames);

  function remove(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      try {
        await deleteRecipe(recipe.id);
      } catch {
        toast.error("Couldn't remove that recipe");
      }
    });
  }

  return (
    <Link href={`/app/cookbook/${recipe.id}`} className="block">
      <Card
        className="relative h-full overflow-hidden py-0 transition-shadow hover:shadow-md"
        style={pending ? { opacity: 0.5 } : undefined}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={remove}
          aria-label={`Delete ${recipe.title}`}
          className="absolute right-2 top-2 z-10 size-7 bg-black/10 text-white hover:bg-black/20 hover:text-white"
        >
          <Trash2 className="size-3.5" />
        </Button>

        {/* Hero: stands in for a food photo until real images exist. */}
        <div
          className="grid aspect-[4/3] w-full place-items-center"
          style={{ backgroundImage: heroGradient(recipe.id) }}
        >
          <span className="text-6xl drop-shadow-sm" aria-hidden>
            {isEmojiIcon(recipe.image_url) ? recipe.image_url : "🍽️"}
          </span>
        </div>

        <CardContent className="flex flex-col gap-2 px-4 pb-4 pt-3">
          <div className="min-w-0">
            <p className="truncate font-heading font-semibold">{recipe.title}</p>
            {recipe.description && (
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {recipe.description}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="gap-1">
              {recipe.source === "ai" ? (
                <Sparkles className="size-3" />
              ) : (
                <UserRound className="size-3" />
              )}
              {recipe.source === "ai" ? "AI" : "Yours"}
            </Badge>
            {match.total > 0 && (
              <Badge
                variant={match.have === match.total ? "default" : "secondary"}
              >
                {match.have}/{match.total} on hand
              </Badge>
            )}
            {recipe.macros && (
              <Badge variant="secondary">
                {Math.round(recipe.macros.calories)} kcal
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
