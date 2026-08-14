"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { LogFoodDialog } from "@/components/macros/log-food-dialog";
import type { RecentMeal } from "@/app/app/macros/actions";

export function QuickLogFab({ recentMeals }: { recentMeals: RecentMeal[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+4.5rem)] z-30 flex justify-center">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Log food"
          className="grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 ring-4 ring-background transition-transform active:scale-90"
        >
          <Plus className="size-6" strokeWidth={2.4} />
        </button>
      </div>
      <LogFoodDialog open={open} onOpenChange={setOpen} recentMeals={recentMeals} />
    </>
  );
}
