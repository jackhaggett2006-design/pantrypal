import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CookingMode } from "@/components/cookbook/cooking-mode";
import type { RecipeStep } from "@/lib/types";

export default async function CookPage({
  params,
}: PageProps<"/app/cookbook/[id]/cook">) {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("recipes")
    .select("id, title, image_url, steps")
    .eq("id", id)
    .single();

  if (!data) notFound();

  const steps = (data.steps as RecipeStep[]) ?? [];

  return (
    <CookingMode
      recipeId={data.id}
      title={data.title}
      icon={data.image_url}
      steps={steps}
    />
  );
}
