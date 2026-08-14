import Link from "next/link";
import { notFound } from "next/navigation";
import { ChefHat, Sparkles, UserRound, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { LogRecipeButton } from "@/components/cookbook/log-recipe-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { isEmojiIcon } from "@/lib/recipe-match";
import type { Recipe, RecipeIngredient } from "@/lib/types";

export default async function RecipeDetailPage({
  params,
}: PageProps<"/app/cookbook/[id]">) {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("recipes")
    .select("*, recipe_ingredients(*)")
    .eq("id", id)
    .single();

  if (!data) notFound();

  const recipe = data as unknown as Recipe & { recipe_ingredients: RecipeIngredient[] };
  const macros = recipe.macros;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-4">
        <span
          className="grid size-16 shrink-0 place-items-center rounded-2xl bg-accent text-4xl"
          aria-hidden
        >
          {isEmojiIcon(recipe.image_url) ? recipe.image_url : "🍽️"}
        </span>
        <div className="min-w-0">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            {recipe.title}
          </h1>
          {recipe.description && (
            <p className="mt-1 text-muted-foreground">{recipe.description}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="gap-1">
              {recipe.source === "ai" ? (
                <Sparkles className="size-3" />
              ) : (
                <UserRound className="size-3" />
              )}
              {recipe.source === "ai" ? "AI-generated" : "Your recipe"}
            </Badge>
            {recipe.servings && (
              <Badge variant="secondary" className="gap-1">
                <Users className="size-3" />
                {recipe.servings} serving{recipe.servings !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {macros && (
        <>
          <Card>
            <CardContent className="grid grid-cols-4 gap-3 py-4 text-center">
              <Stat label="kcal" value={Math.round(macros.calories)} />
              <Stat label="Protein" value={`${macros.protein_g}g`} />
              <Stat label="Carbs" value={`${macros.carbs_g}g`} />
              <Stat label="Fat" value={`${macros.fat_g}g`} />
            </CardContent>
          </Card>
          <LogRecipeButton recipeId={recipe.id} />
        </>
      )}

      <Card>
        <CardContent className="flex flex-col gap-3 py-5">
          <h2 className="font-medium">Ingredients</h2>
          <ul className="flex flex-col gap-1.5 text-sm">
            {recipe.recipe_ingredients.length === 0 ? (
              <li className="text-muted-foreground">No ingredients listed.</li>
            ) : (
              recipe.recipe_ingredients.map((ing) => (
                <li key={ing.id} className="flex justify-between gap-2">
                  <span>{ing.name}</span>
                  {ing.quantity != null && (
                    <span className="text-muted-foreground">
                      {ing.quantity}
                      {ing.unit ?? ""}
                    </span>
                  )}
                </li>
              ))
            )}
          </ul>
        </CardContent>
      </Card>

      <Separator />

      <Button asChild size="lg" className="w-full gap-2">
        <Link href={`/app/cookbook/${recipe.id}/cook`}>
          <ChefHat className="size-5" /> Start cooking
        </Link>
      </Button>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col">
      <span className="text-lg font-semibold tabular-nums">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
