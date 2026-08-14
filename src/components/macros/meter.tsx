import { TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A single-ratio meter (value against a goal). Color is a validated
 * categorical slot per metric (see globals.css); the track is a lighter step
 * of that same hue so state reads across the whole bar. Every meter is
 * direct-labeled with its numbers — never color-alone. Going over goal swaps
 * the fill to the reserved status "warning" color, paired with an icon+label.
 */
export function Meter({
  label,
  value,
  goal,
  unit,
  cssVar,
  hero = false,
}: {
  label: string;
  value: number;
  goal: number;
  unit: string;
  cssVar: "--chart-1" | "--chart-2" | "--chart-3" | "--chart-4";
  hero?: boolean;
}) {
  const pct = goal > 0 ? Math.min(100, (value / goal) * 100) : 0;
  const over = goal > 0 && value > goal;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className={cn("font-medium", hero ? "text-base" : "text-sm")}>
          {label}
        </span>
        <span
          className={cn(
            "flex items-center gap-1 tabular-nums text-muted-foreground",
            hero ? "text-sm" : "text-xs",
          )}
        >
          {over && (
            <TriangleAlert
              className="size-3"
              style={{ color: "var(--status-warning)" }}
              aria-hidden
            />
          )}
          {Math.round(value)} / {goal}
          {unit}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={`${label}: ${Math.round(value)} of ${goal}${unit}`}
        aria-valuenow={Math.round(value)}
        aria-valuemin={0}
        aria-valuemax={goal}
        className={cn(
          "w-full overflow-hidden rounded-full",
          hero ? "h-4" : "h-2.5",
        )}
        style={{
          background: `color-mix(in oklch, var(${cssVar}) 18%, var(--card))`,
        }}
      >
        <div
          className="h-full rounded-full transition-[width] duration-500 ease-out"
          style={{
            width: `${pct}%`,
            background: over ? "var(--status-warning)" : `var(${cssVar})`,
          }}
        />
      </div>
    </div>
  );
}
