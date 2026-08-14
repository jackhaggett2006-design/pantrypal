"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2, Repeat } from "lucide-react";
import { toast } from "sonner";
import { getRecentMeals, logPastMeal, type RecentMeal } from "@/app/app/macros/actions";

/** Self-contained: fetches its own recent-meals list on mount so this tab
 * (and the dialog it lives in) can be dropped in anywhere — a page, the nav
 * bar — without a server component threading the data down first. */
export function RecentMealsPicker({ onDone }: { onDone: () => void }) {
  const [meals, setMeals] = useState<RecentMeal[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    getRecentMeals().then((m) => {
      if (!cancelled) setMeals(m);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (meals === null) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (meals.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Nothing logged yet — meals you log will show up here for a one-tap
        repeat next time.
      </p>
    );
  }

  return (
    <ul className="flex max-h-80 flex-col gap-2 overflow-y-auto py-2">
      {meals.map((meal) => (
        <RecentMealRow key={meal.food_name} meal={meal} onDone={onDone} />
      ))}
    </ul>
  );
}

function RecentMealRow({
  meal,
  onDone,
}: {
  meal: RecentMeal;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();

  function log() {
    startTransition(async () => {
      try {
        await logPastMeal(meal);
        toast.success(`Logged ${meal.food_name}`);
        onDone();
      } catch {
        toast.error("Couldn't log that");
      }
    });
  }

  return (
    <li>
      <button
        type="button"
        onClick={log}
        disabled={pending}
        className="flex w-full items-center justify-between gap-3 rounded-xl border bg-card px-3 py-2.5 text-left transition-colors hover:bg-accent/40 disabled:opacity-50"
      >
        <div className="min-w-0">
          <p className="truncate font-medium">{meal.food_name}</p>
          <p className="text-xs text-muted-foreground">
            {Math.round(meal.calories)} kcal
            {meal.times_logged > 1 ? ` · had ${meal.times_logged}×` : ""}
          </p>
        </div>
        <Repeat className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      </button>
    </li>
  );
}
