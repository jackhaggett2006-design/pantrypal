"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteIntakeEntry } from "@/app/app/macros/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { IntakeEntry } from "@/lib/types";

export function IntakeList({ entries }: { entries: IntakeEntry[] }) {
  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Nothing logged yet today.
        </CardContent>
      </Card>
    );
  }

  const totalCalories = entries.reduce((sum, e) => sum + e.calories, 0);

  return (
    <div className="overflow-hidden rounded-2xl border bg-card font-mono">
      <ul className="divide-y divide-dashed divide-border">
        {entries.map((entry) => (
          <IntakeRow key={entry.id} entry={entry} />
        ))}
      </ul>
      <div className="flex items-center justify-between border-t-2 border-dashed border-foreground/30 px-4 py-2.5 text-sm font-semibold">
        <span>Total</span>
        <span className="tabular-nums">{Math.round(totalCalories)} kcal</span>
      </div>
    </div>
  );
}

function IntakeRow({ entry }: { entry: IntakeEntry }) {
  const [pending, startTransition] = useTransition();
  const time = new Date(entry.created_at).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  function remove() {
    startTransition(async () => {
      try {
        await deleteIntakeEntry(entry.id);
      } catch {
        toast.error("Couldn't remove that entry");
      }
    });
  }

  return (
    <li
      className="flex items-center gap-3 px-4 py-2.5 text-sm"
      style={pending ? { opacity: 0.5 } : undefined}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{entry.food_name}</p>
        <p className="text-xs text-muted-foreground">
          {time} &middot; {entry.protein_g}P {entry.carbs_g}C {entry.fat_g}F
        </p>
      </div>
      <span className="tabular-nums font-semibold">{Math.round(entry.calories)}</span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={remove}
        disabled={pending}
        aria-label={`Remove ${entry.food_name}`}
        className="size-7"
      >
        <Trash2 className="size-3.5" />
      </Button>
    </li>
  );
}
