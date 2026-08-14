"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { logFromPantry, logManual } from "@/app/app/macros/actions";
import { DescribeFoodForm } from "@/components/macros/describe-food-form";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PantryItem } from "@/lib/types";

export function LogFoodDialog({ pantryItems }: { pantryItems: PantryItem[] }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="w-full gap-2">
          <Plus className="size-5" /> Log food
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log food</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="describe">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="describe">Describe</TabsTrigger>
            <TabsTrigger value="fridge">From fridge</TabsTrigger>
            <TabsTrigger value="manual">Manual</TabsTrigger>
          </TabsList>
          <TabsContent value="describe">
            <DescribeFoodForm onDone={() => setOpen(false)} />
          </TabsContent>
          <TabsContent value="fridge">
            <FromFridgeForm pantryItems={pantryItems} onDone={() => setOpen(false)} />
          </TabsContent>
          <TabsContent value="manual">
            <ManualLogForm onDone={() => setOpen(false)} />
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
