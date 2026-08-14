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
        className="relative h-full transition-shadow hover:shadow-md"
        style={pending ? { opacity: 0.5 } : undefined}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={remove}
          aria-label={`Delete ${recipe.title}`}
          className="absolute right-2 top-2 z-10 size-7"
        >
          <Trash2 className="size-3.5" />
        </Button>
        <CardContent className="flex flex-col gap-3 py-5">
          <div className="flex items-center gap-3">
            <span
              className="grid size-12 shrink-0 place-items-center rounded-xl bg-accent text-2xl"
              aria-hidden
            >
              {isEmojiIcon(recipe.image_url) ? recipe.image_url : "🍽️"}
            </span>
            <div className="min-w-0">
              <p className="truncate pr-6 font-medium">{recipe.title}</p>
              {recipe.description && (
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {recipe.description}
                </p>
              )}
            </div>
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
                {match.have}/{match.total} ingredients on hand
              </Badge>
            )}
            {recipe.macros && (
              <Badge variant="secondary">
                {Math.round(recipe.macros.calories)} kcal/serving
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
