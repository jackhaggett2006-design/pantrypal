import type { MacroGoals, Macros } from "@/lib/types";

/**
 * Home-screen status at a glance: a hero ring for calories remaining plus
 * three small rings for protein/carbs/fat — distinct from the Nutrition
 * Facts label on the Macros page itself, so the two screens don't repeat
 * the same figure twice. Modeled on the ring-progress pattern used by
 * food-photo trackers like Cal AI, since that's the closest analog to
 * PantryPal's own "snap a photo, see it tracked" loop.
 */
export function MacroRings({ goals, totals }: { goals: MacroGoals; totals: Macros }) {
  const remaining = Math.max(0, goals.calories - totals.calories);
  const over = totals.calories > goals.calories;

  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="flex items-center gap-5">
        <Ring
          value={totals.calories}
          goal={goals.calories}
          size={104}
          strokeWidth={10}
          cssVar="--chart-1"
        >
          <span className="text-2xl font-black tabular-nums leading-none">
            {Math.round(over ? totals.calories - goals.calories : remaining).toLocaleString()}
          </span>
          <span className="text-[10px] font-medium text-muted-foreground">
            {over ? "over" : "left"}
          </span>
        </Ring>
        <div className="min-w-0 flex-1">
          <p className="font-heading font-semibold">Today</p>
          <p className="text-sm text-muted-foreground">
            {Math.round(totals.calories).toLocaleString()} of{" "}
            {goals.calories.toLocaleString()} kcal
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <MiniRing label="Protein" value={totals.protein_g} goal={goals.protein_g} cssVar="--chart-2" />
        <MiniRing label="Carbs" value={totals.carbs_g} goal={goals.carbs_g} cssVar="--chart-3" />
        <MiniRing label="Fat" value={totals.fat_g} goal={goals.fat_g} cssVar="--chart-4" />
      </div>
    </div>
  );
}

function MiniRing({
  label,
  value,
  goal,
  cssVar,
}: {
  label: string;
  value: number;
  goal: number;
  cssVar: "--chart-2" | "--chart-3" | "--chart-4";
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-xl bg-secondary/50 py-3">
      <Ring value={value} goal={goal} size={52} strokeWidth={6} cssVar={cssVar}>
        <span className="text-xs font-bold tabular-nums leading-none">
          {Math.round(value)}
        </span>
      </Ring>
      <span className="text-[11px] font-medium text-muted-foreground">
        {label} · {goal}g
      </span>
    </div>
  );
}

function Ring({
  value,
  goal,
  size,
  strokeWidth,
  cssVar,
  children,
}: {
  value: number;
  goal: number;
  size: number;
  strokeWidth: number;
  cssVar: string;
  children: React.ReactNode;
}) {
  const pct = goal > 0 ? Math.min(1, value / goal) : 0;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct);
  const over = goal > 0 && value > goal;

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={goal}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          style={{ stroke: `color-mix(in oklch, var(${cssVar}) 16%, var(--card))` }}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
          style={{ stroke: over ? "var(--status-warning)" : `var(${cssVar})` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}
