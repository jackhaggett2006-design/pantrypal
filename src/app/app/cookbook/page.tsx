import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { GenerateRecipesButton } from "@/components/cookbook/generate-button";
import { CreateRecipeDialog } from "@/components/cookbook/create-recipe-dialog";
import { RecipeCard } from "@/components/cookbook/recipe-card";
import { Card, CardContent } from "@/components/ui/card";
import type { PantryItem, Recipe, RecipeIngredient } from "@/lib/types";

type RecipeWithIngredients = Recipe & { recipe_ingredients: RecipeIngredient[] };

export default async function CookbookPage() {
  const supabase = await createClient();

  const [{ data: recipeRows }, { data: pantryRows }] = await Promise.all([
    supabase
      .from("recipes")
      .select("*, recipe_ingredients(*)")
      .order("created_at", { ascending: false }),
    supabase.from("pantry_items").select("*").order("added_at", { ascending: false }),
  ]);

  const recipes = (recipeRows ?? []) as unknown as RecipeWithIngredients[];
  const pantryItems = (pantryRows ?? []) as PantryItem[];
  const pantryNames = pantryItems.map((p) => p.name.toLowerCase());

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Cookbook"
          subtitle="Recipes you can actually make with what's in your fridge."
        />
        <CreateRecipeDialog />
      </div>

      <GenerateRecipesButton hasPantryItems={pantryItems.length > 0} />

      {recipes.length === 0 ? (
        <Card>
          <CardContent className="grid place-items-center gap-2 py-16 text-center">
            <span className="text-4xl">📖</span>
            <p className="font-medium">No recipes yet</p>
            <p className="max-w-xs text-sm text-muted-foreground">
              Tap <span className="font-medium">What can I make?</span> to
              generate recipes from your fridge, or write your own.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {recipes.map((r) => (
            <RecipeCard key={r.id} recipe={r} pantryNames={pantryNames} />
          ))}
        </div>
      )}
    </div>
  );
}
