"use client";

import { useState, useTransition } from "react";
import { Utensils } from "lucide-react";
import { toast } from "sonner";
import { logRecipe } from "@/app/app/macros/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LogRecipeButton({ recipeId }: { recipeId: string }) {
  const [servings, setServings] = useState(1);
  const [pending, startTransition] = useTransition();

  function log() {
    const fd = new FormData();
    fd.set("recipeId", recipeId);
    fd.set("servings", String(servings));
    startTransition(async () => {
      try {
        await logRecipe(fd);
        toast.success("Added to today's macros");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Couldn't log this recipe");
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-card p-3">
      <Utensils className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      <span className="text-sm text-muted-foreground">Log</span>
      <Input
        type="number"
        min={0.5}
        step={0.5}
        value={servings}
        onChange={(e) => setServings(Number(e.target.value) || 1)}
        aria-label="Servings eaten"
        className="h-8 w-16"
      />
      <span className="text-sm text-muted-foreground">
        serving{servings !== 1 ? "s" : ""} to today&apos;s macros
      </span>
      <Button size="sm" className="ml-auto" onClick={log} disabled={pending}>
        {pending ? "Logging…" : "Log"}
      </Button>
    </div>
  );
}
