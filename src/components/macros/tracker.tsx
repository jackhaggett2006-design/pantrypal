import { TriangleAlert } from "lucide-react";
import type { MacroGoals, Macros } from "@/lib/types";

/**
 * Today's totals, styled after the one nutrition artifact everyone already
 * knows how to read: the label on the back of a food package. Thick/thin
 * rule hierarchy and bold tabular numerals do the work that a bank of
 * colorful progress bars usually does — quieter, and it's actually true to
 * the subject instead of borrowed from every other tracker's dashboard.
 */
export function MacroTracker({
  goals,
  totals,
}: {
  goals: MacroGoals;
  totals: Macros;
}) {
  const remaining = Math.max(0, goals.calories - totals.calories);
  const over = totals.calories > goals.calories;

  return (
    <div className="overflow-hidden rounded-2xl border-2 border-foreground bg-card text-foreground">
      <div className="px-4 pb-2 pt-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
          Nutrition Facts
        </p>
        <p className="font-heading text-xl font-black tracking-tight">Today</p>
      </div>

      <div className="border-t-8 border-foreground px-4 py-2">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-base font-bold">Calories</span>
          <span className="text-4xl font-black tabular-nums leading-none">
            {Math.round(totals.calories).toLocaleString()}
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
          <span>of {goals.calories.toLocaleString()} goal</span>
          <span className="flex items-center gap-1 font-medium">
            {over && (
              <TriangleAlert
                className="size-3"
                style={{ color: "var(--status-warning)" }}
                aria-hidden
              />
            )}
            {over
              ? `${(totals.calories - goals.calories).toLocaleString()} over`
              : `${remaining.toLocaleString()} left`}
          </span>
        </div>
      </div>

      <div className="border-t-4 border-foreground px-4">
        <FactsRow label="Protein" value={totals.protein_g} goal={goals.protein_g} cssVar="--chart-2" />
        <FactsRow label="Carbs" value={totals.carbs_g} goal={goals.carbs_g} cssVar="--chart-3" />
        <FactsRow
          label="Fat"
          value={totals.fat_g}
          goal={goals.fat_g}
          cssVar="--chart-4"
          last
        />
      </div>
    </div>
  );
}

function FactsRow({
  label,
  value,
  goal,
  cssVar,
  last = false,
}: {
  label: string;
  value: number;
  goal: number;
  cssVar: "--chart-2" | "--chart-3" | "--chart-4";
  last?: boolean;
}) {
  const pct = goal > 0 ? Math.round((value / goal) * 100) : 0;
  const barPct = Math.min(100, pct);

  return (
    <div className={last ? "py-2.5" : "border-b border-border py-2.5"}>
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <span
            className="inline-block size-2 translate-y-[-1px] rounded-full"
            style={{ background: `var(${cssVar})` }}
            aria-hidden
          />
          <span className="font-semibold">{label}</span>
          <span className="text-xs tabular-nums text-muted-foreground">
            {Math.round(value)}g of {goal}g
          </span>
        </div>
        <span className="text-sm font-bold tabular-nums">{pct}%</span>
      </div>
      <div
        role="progressbar"
        aria-label={`${label}: ${Math.round(value)} of ${goal}g`}
        aria-valuenow={Math.round(value)}
        aria-valuemin={0}
        aria-valuemax={goal}
        className="mt-1.5 h-[3px] w-full overflow-hidden rounded-full bg-border"
      >
        <div
          className="h-full rounded-full transition-[width] duration-500 ease-out"
          style={{ width: `${barPct}%`, background: `var(${cssVar})` }}
        />
      </div>
    </div>
  );
}
