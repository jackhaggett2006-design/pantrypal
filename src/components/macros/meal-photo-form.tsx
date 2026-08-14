"use client";

import { useState, useTransition } from "react";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { analyzeMealPhoto, logMealEstimate } from "@/app/app/macros/actions";
import { CameraCaptureSheet } from "@/components/fridge/camera-capture-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { MealEstimate } from "@/lib/vision";

export function MealPhotoForm({ onDone }: { onDone: () => void }) {
  const [cameraOpen, setCameraOpen] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [estimate, setEstimate] = useState<MealEstimate | null>(null);
  const [saving, startSaving] = useTransition();

  async function handleCapture(file: File) {
    setCameraOpen(false);
    setAnalyzing(true);
    setEstimate(null);
    const fd = new FormData();
    fd.set("photo", file);
    try {
      const result = await analyzeMealPhoto(fd);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setEstimate(result.estimate);
    } catch {
      toast.error("Something went wrong reading that photo — try again.");
    } finally {
      setAnalyzing(false);
    }
  }

  function save() {
    if (!estimate) return;
    startSaving(async () => {
      try {
        await logMealEstimate(estimate);
        toast.success(`Logged ${estimate.name}`);
        onDone();
      } catch {
        toast.error("Couldn't log that");
      }
    });
  }

  if (analyzing) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-border bg-secondary/40 px-6 py-10 text-center">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Sizing up your plate…</p>
      </div>
    );
  }

  if (estimate) {
    return (
      <div className="flex flex-col gap-4 py-2">
        <p className="text-sm text-muted-foreground">
          Here&apos;s our best guess. Edit anything before logging.
        </p>
        <div className="flex flex-col gap-2">
          <Label htmlFor="meal-name">Meal</Label>
          <Input
            id="meal-name"
            value={estimate.name}
            onChange={(e) => setEstimate({ ...estimate, name: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="meal-cal">Calories</Label>
            <Input
              id="meal-cal"
              type="number"
              min={0}
              value={estimate.calories}
              onChange={(e) => setEstimate({ ...estimate, calories: Number(e.target.value) })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="meal-protein">Protein (g)</Label>
            <Input
              id="meal-protein"
              type="number"
              min={0}
              value={estimate.protein_g}
              onChange={(e) => setEstimate({ ...estimate, protein_g: Number(e.target.value) })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="meal-carbs">Carbs (g)</Label>
            <Input
              id="meal-carbs"
              type="number"
              min={0}
              value={estimate.carbs_g}
              onChange={(e) => setEstimate({ ...estimate, carbs_g: Number(e.target.value) })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="meal-fat">Fat (g)</Label>
            <Input
              id="meal-fat"
              type="number"
              min={0}
              value={estimate.fat_g}
              onChange={(e) => setEstimate({ ...estimate, fat_g: Number(e.target.value) })}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => setEstimate(null)}>
            Retake
          </Button>
          <Button className="flex-1" onClick={save} disabled={saving}>
            {saving ? "Logging…" : "Log it"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-2">
      <button
        type="button"
        onClick={() => setCameraOpen(true)}
        className="flex w-full cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-border bg-secondary/40 px-6 py-10 text-center transition-colors hover:border-primary/50 hover:bg-accent/40"
      >
        <Camera className="size-8 text-primary" />
        <div>
          <p className="font-medium">Snap your plate</p>
          <p className="text-sm text-muted-foreground">
            Opens the camera right here — no app switching.
          </p>
        </div>
      </button>

      <CameraCaptureSheet
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={handleCapture}
      />
    </div>
  );
}
