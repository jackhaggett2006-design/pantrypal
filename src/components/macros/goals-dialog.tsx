"use client";

import { useState, useTransition } from "react";
import { Settings2 } from "lucide-react";
import { toast } from "sonner";
import { saveGoals } from "@/app/app/macros/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { MacroGoals } from "@/lib/types";

export function GoalsDialog({ goals }: { goals: MacroGoals }) {
  const [open, setOpen] = useState(false);
  const [saving, startSaving] = useTransition();

  function action(formData: FormData) {
    startSaving(async () => {
      try {
        await saveGoals(formData);
        toast.success("Goals updated");
        setOpen(false);
      } catch {
        toast.error("Couldn't save your goals");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Edit macro goals">
          <Settings2 className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Daily macro goals</DialogTitle>
        </DialogHeader>
        <form action={action} className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="calories">Calories (kcal)</Label>
            <Input
              id="calories"
              name="calories"
              type="number"
              min={0}
              defaultValue={goals.calories}
              required
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="protein_g">Protein (g)</Label>
              <Input
                id="protein_g"
                name="protein_g"
                type="number"
                min={0}
                defaultValue={goals.protein_g}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="carbs_g">Carbs (g)</Label>
              <Input
                id="carbs_g"
                name="carbs_g"
                type="number"
                min={0}
                defaultValue={goals.carbs_g}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="fat_g">Fat (g)</Label>
              <Input
                id="fat_g"
                name="fat_g"
                type="number"
                min={0}
                defaultValue={goals.fat_g}
                required
              />
            </div>
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save goals"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
