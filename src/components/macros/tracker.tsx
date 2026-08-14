import { Meter } from "@/components/macros/meter";
import { Card, CardContent } from "@/components/ui/card";
import type { MacroGoals, Macros } from "@/lib/types";

export function MacroTracker({
  goals,
  totals,
}: {
  goals: MacroGoals;
  totals: Macros;
}) {
  const remaining = Math.max(0, goals.calories - totals.calories);

  return (
    <Card>
      <CardContent className="flex flex-col gap-6 py-6">
        {/* Hero figure: the one number this view leads with. */}
        <div className="flex flex-col items-center gap-1 text-center">
          <span className="text-5xl font-semibold tabular-nums tracking-tight">
            {Math.round(totals.calories).toLocaleString()}
          </span>
          <span className="text-sm text-muted-foreground">
            of {goals.calories.toLocaleString()} kcal today &middot;{" "}
            {remaining > 0
              ? `${remaining.toLocaleString()} left`
              : "goal reached"}
          </span>
        </div>

        <Meter
          label="Calories"
          value={totals.calories}
          goal={goals.calories}
          unit=" kcal"
          cssVar="--chart-1"
          hero
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Meter
            label="Protein"
            value={totals.protein_g}
            goal={goals.protein_g}
            unit="g"
            cssVar="--chart-2"
          />
          <Meter
            label="Carbs"
            value={totals.carbs_g}
            goal={goals.carbs_g}
            unit="g"
            cssVar="--chart-3"
          />
          <Meter
            label="Fat"
            value={totals.fat_g}
            goal={goals.fat_g}
            unit="g"
            cssVar="--chart-4"
          />
        </div>
      </CardContent>
    </Card>
  );
}
