"use client";

import Link from "next/link";
import { useTransition } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { deleteRecipe } from "@/app/app/cookbook/actions";
import { computeMatch, heroGradient, isEmojiIcon } from "@/lib/recipe-match";
import { cn } from "@/lib/utils";
import type { Recipe, RecipeIngredient } from "@/lib/types";

type RecipeWithIngredients = Recipe & { recipe_ingredients: RecipeIngredient[] };

export function RecipeCard({
  recipe,
  pantryNames,
}: {
  recipe: RecipeWithIngredients;
  pantryNames: string[];
}) {
  const [pending, startTransition] = useTransition();
  const match = computeMatch(recipe.recipe_ingredients, pantryNames);
  const fullMatch = match.total > 0 && match.have === match.total;

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
    <Link href={`/app/cookbook/${recipe.id}`} className="group block">
      <div
        className="relative aspect-square w-full overflow-hidden rounded-xl"
        style={{
          backgroundImage: heroGradient(recipe.id),
          opacity: pending ? 0.5 : 1,
        }}
      >
        <span className="grid h-full w-full place-items-center text-4xl drop-shadow-sm" aria-hidden>
          {isEmojiIcon(recipe.image_url) ? recipe.image_url : "🍽️"}
        </span>

        {fullMatch && (
          <span
            className="absolute bottom-1 left-1 rounded-full bg-black/45 px-1.5 py-[3px] text-[9px] font-semibold leading-none text-white backdrop-blur-sm"
            title="You have everything for this"
          >
            have it all
          </span>
        )}

        <button
          type="button"
          onClick={remove}
          aria-label={`Delete ${recipe.title}`}
          className={cn(
            "absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-black/40 text-white opacity-0 backdrop-blur-sm transition-opacity",
            "group-hover:opacity-100 focus-visible:opacity-100",
          )}
        >
          <X className="size-3.5" />
        </button>
      </div>

      <p className="mt-1.5 truncate text-xs font-semibold leading-tight">
        {recipe.title}
      </p>
      {recipe.macros && (
        <p className="text-[11px] text-muted-foreground">
          {Math.round(recipe.macros.calories)} kcal
        </p>
      )}
    </Link>
  );
}
