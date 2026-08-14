"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ChefHat, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { getRecommendation } from "@/app/app/cookbook/actions";
import { heroGradient, isEmojiIcon } from "@/lib/recipe-match";
import type { Recipe, RecipeIngredient } from "@/lib/types";

type RecipeWithIngredients = Recipe & { recipe_ingredients: RecipeIngredient[] };

export function RecommendedPick({ recipes }: { recipes: RecipeWithIngredients[] }) {
  const [pending, startTransition] = useTransition();
  const [pick, setPick] = useState<{ recipe: RecipeWithIngredients; reason: string } | null>(
    null,
  );

  function run() {
    startTransition(async () => {
      const result = await getRecommendation();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      const recipe = recipes.find((r) => r.id === result.recommendation.recipeId);
      if (!recipe) {
        toast.error("Couldn't find that recipe.");
        return;
      }
      setPick({ recipe, reason: result.recommendation.reason });
    });
  }

  if (pick) {
    const { recipe, reason } = pick;
    return (
      <Link href={`/app/cookbook/${recipe.id}`} className="block">
        <div className="flex items-center gap-3 overflow-hidden rounded-2xl border-2 border-primary/30 bg-card p-3 shadow-sm transition-shadow hover:shadow-md">
          <div
            className="grid size-16 shrink-0 place-items-center rounded-xl text-3xl"
            style={{ backgroundImage: heroGradient(recipe.id) }}
            aria-hidden
          >
            {isEmojiIcon(recipe.image_url) ? recipe.image_url : "🍽️"}
          </div>
          <div className="min-w-0">
            <p className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
              <Sparkles className="size-3" /> Right now
            </p>
            <p className="truncate font-heading font-semibold">{recipe.title}</p>
            <p className="line-clamp-2 text-xs text-muted-foreground">{reason}</p>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={run}
      disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/30 bg-accent/30 px-4 py-3 text-sm font-medium text-primary transition-colors hover:bg-accent/50 disabled:opacity-60"
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" /> Thinking about what fits today…
        </>
      ) : (
        <>
          <ChefHat className="size-4" /> What should I eat right now?
        </>
      )}
    </button>
  );
}
