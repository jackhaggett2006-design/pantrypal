"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { logManual, type RecentMeal } from "@/app/app/macros/actions";
import { MealPhotoForm } from "@/components/macros/meal-photo-form";
import { RecentMealsPicker } from "@/components/macros/recent-meals-picker";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function LogFoodDialog({
  open,
  onOpenChange,
  recentMeals,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recentMeals: RecentMeal[];
}) {
  const close = () => onOpenChange(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log food</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue={recentMeals.length > 0 ? "meal" : "photo"}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="meal">Meal</TabsTrigger>
            <TabsTrigger value="photo">Photo</TabsTrigger>
            <TabsTrigger value="manual">Manual</TabsTrigger>
          </TabsList>
          <TabsContent value="meal">
            <RecentMealsPicker meals={recentMeals} onDone={close} />
          </TabsContent>
          <TabsContent value="photo">
            <MealPhotoForm onDone={close} />
          </TabsContent>
          <TabsContent value="manual">
            <ManualLogForm onDone={close} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function ManualLogForm({ onDone }: { onDone: () => void }) {
  const [saving, startSaving] = useTransition();

  function action(formData: FormData) {
    startSaving(async () => {
      try {
        await logManual(formData);
        toast.success("Logged");
        onDone();
      } catch {
        toast.error("Couldn't log that food");
      }
    });
  }

  return (
    <form action={action} className="flex flex-col gap-4 py-2">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Food</Label>
        <Input id="name" name="name" placeholder="e.g. Greek yogurt" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="grams">Amount (grams)</Label>
        <Input id="grams" name="grams" type="number" min={1} defaultValue={100} required />
      </div>
      <p className="text-xs text-muted-foreground">
        We&apos;ll look up macros from USDA FoodData Central automatically.
      </p>
      <Button type="submit" disabled={saving}>
        {saving ? "Logging…" : "Log it"}
      </Button>
    </form>
  );
}
