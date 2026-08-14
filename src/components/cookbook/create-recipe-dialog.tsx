"use client";

import { useState, useTransition } from "react";
import { NotebookPen } from "lucide-react";
import { toast } from "sonner";
import { createUserRecipe } from "@/app/app/cookbook/actions";
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

export function CreateRecipeDialog() {
  const [open, setOpen] = useState(false);
  const [saving, startSaving] = useTransition();

  function action(formData: FormData) {
    startSaving(async () => {
      try {
        await createUserRecipe(formData);
        toast.success("Recipe added");
        setOpen(false);
      } catch {
        toast.error("Couldn't save that recipe");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Create a recipe">
          <NotebookPen className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create a recipe</DialogTitle>
        </DialogHeader>
        <form action={action} className="flex flex-col gap-4 py-2">
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" placeholder="Weeknight fried rice" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="emoji">Icon</Label>
              <Input id="emoji" name="emoji" defaultValue="🍽️" className="w-16 text-center" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Description</Label>
            <Input id="description" name="description" placeholder="Quick, uses up leftover rice" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="servings">Servings</Label>
            <Input id="servings" name="servings" type="number" min={1} defaultValue={2} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ingredients">Ingredients (one per line)</Label>
            <textarea
              id="ingredients"
              name="ingredients"
              rows={4}
              placeholder={"2 eggs\n2 cups cooked rice\n1 tbsp soy sauce"}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm md:text-sm"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="steps">Steps (one per line)</Label>
            <textarea
              id="steps"
              name="steps"
              rows={5}
              placeholder={"Whisk the eggs\nHeat oil in a wok over high heat\nScramble the eggs, then set aside"}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm md:text-sm"
              required
            />
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save recipe"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
