"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { logFromPantry, logManual, type RecentMeal } from "@/app/app/macros/actions";
import { DescribeFoodForm } from "@/components/macros/describe-food-form";
import { MealPhotoForm } from "@/components/macros/meal-photo-form";
import { RecentMealsPicker } from "@/components/macros/recent-meals-picker";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PantryItem } from "@/lib/types";

export function LogFoodDialog({
  open,
  onOpenChange,
  pantryItems,
  recentMeals,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pantryItems: PantryItem[];
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
          <TabsList className="flex w-full justify-start gap-1 overflow-x-auto">
            <TabsTrigger value="meal" className="flex-none">
              Meal
            </TabsTrigger>
            <TabsTrigger value="photo" className="flex-none">
              Photo
            </TabsTrigger>
            <TabsTrigger value="describe" className="flex-none">
              Describe
            </TabsTrigger>
            <TabsTrigger value="fridge" className="flex-none">
              Fridge
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex-none">
              Manual
            </TabsTrigger>
          </TabsList>
          <TabsContent value="meal">
            <RecentMealsPicker meals={recentMeals} onDone={close} />
          </TabsContent>
          <TabsContent value="photo">
            <MealPhotoForm onDone={close} />
          </TabsContent>
          <TabsContent value="describe">
            <DescribeFoodForm onDone={close} />
          </TabsContent>
          <TabsContent value="fridge">
            <FromFridgeForm pantryItems={pantryItems} onDone={close} />
          </TabsContent>
          <TabsContent value="manual">
            <ManualLogForm onDone={close} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function FromFridgeForm({
  pantryItems,
  onDone,
}: {
  pantryItems: PantryItem[];
  onDone: () => void;
}) {
  const [saving, startSaving] = useTransition();

  if (pantryItems.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Your fridge is empty — add items there first, or log manually.
      </p>
    );
  }

  function action(formData: FormData) {
    startSaving(async () => {
      try {
        await logFromPantry(formData);
        toast.success("Logged");
        onDone();
      } catch {
        toast.error("Couldn't log that item");
      }
    });
  }

  return (
    <form action={action} className="flex flex-col gap-4 py-2">
      <div className="flex flex-col gap-2">
        <Label htmlFor="pantryItemId">Item</Label>
        <select
          id="pantryItemId"
          name="pantryItemId"
          required
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
        >
          {pantryItems.map((item) => (
            <option key={item.id} value={item.id}>
              {item.icon_key} {item.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="grams">Amount eaten (grams)</Label>
        <Input id="grams" name="grams" type="number" min={1} defaultValue={100} required />
      </div>
      <Button type="submit" disabled={saving}>
        {saving ? "Logging…" : "Log it"}
      </Button>
    </form>
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
