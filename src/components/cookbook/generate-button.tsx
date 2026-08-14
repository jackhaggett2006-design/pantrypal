"use client";

import { useTransition } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { generateRecipes } from "@/app/app/cookbook/actions";
import { Button } from "@/components/ui/button";

export function GenerateRecipesButton({
  hasPantryItems,
}: {
  hasPantryItems: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function run() {
    startTransition(async () => {
      const result = await generateRecipes();
      if (result.ok) {
        toast.success(`Added ${result.count} new recipe${result.count !== 1 ? "s" : ""}`);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Button
      size="lg"
      className="w-full gap-2"
      onClick={run}
      disabled={pending || !hasPantryItems}
      title={hasPantryItems ? undefined : "Add items to your pantry first"}
    >
      {pending ? (
        <>
          <Loader2 className="size-5 animate-spin" /> Thinking of something…
        </>
      ) : (
        <>
          <Sparkles className="size-5" /> What can I make?
        </>
      )}
    </Button>
  );
}
