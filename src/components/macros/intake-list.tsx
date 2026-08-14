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

  return (
    <ul className="flex flex-col gap-2">
      {entries.map((entry) => (
        <IntakeRow key={entry.id} entry={entry} />
      ))}
    </ul>
  );
}

function IntakeRow({ entry }: { entry: IntakeEntry }) {
  const [pending, startTransition] = useTransition();

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
    <li className="flex items-center gap-3 rounded-xl border bg-card p-3">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{entry.food_name}</p>
        <p className="text-xs text-muted-foreground">
          {entry.quantity ?? ""}
          {entry.unit ?? ""} &middot; {Math.round(entry.calories)} kcal &middot;{" "}
          {entry.protein_g}g P &middot; {entry.carbs_g}g C &middot; {entry.fat_g}g F
        </p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={remove}
        disabled={pending}
        aria-label={`Remove ${entry.food_name}`}
      >
        <Trash2 className="size-4" />
      </Button>
    </li>
  );
}
