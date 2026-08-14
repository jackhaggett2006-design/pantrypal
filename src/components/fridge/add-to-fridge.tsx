"use client";

import { useState, useTransition } from "react";
import { Camera, ImageOff, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  analyzePhoto,
  savePantryItems,
  addManualItem,
  type DraftItem,
} from "@/app/app/pantry/actions";
import { FOOD_CATEGORIES } from "@/lib/food-icons";
import { CameraCaptureSheet } from "@/components/fridge/camera-capture-sheet";
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

export function AddToFridge() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2">
          <Camera className="size-5" /> Add food
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add to your pantry</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="photo">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="photo">Photo</TabsTrigger>
            <TabsTrigger value="manual">Manual</TabsTrigger>
          </TabsList>
          <TabsContent value="photo">
            <PhotoFlow onDone={() => setOpen(false)} />
          </TabsContent>
          <TabsContent value="manual">
            <ManualForm onDone={() => setOpen(false)} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function PhotoFlow({ onDone }: { onDone: () => void }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<DraftItem[] | null>(null);
  const [saving, startSaving] = useTransition();
  const [cameraOpen, setCameraOpen] = useState(false);

  async function handleCapture(file: File) {
    setCameraOpen(false);
    setAnalyzing(true);
    setError(null);
    setDrafts(null);
    const fd = new FormData();
    fd.set("photo", file);
    try {
      const result = await analyzePhoto(fd);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDrafts(result.items);
    } catch {
      setError("Something went wrong reading that photo — try again.");
    } finally {
      setAnalyzing(false);
    }
  }

  function updateName(i: number, name: string) {
    setDrafts((d) => d && d.map((it, j) => (j === i ? { ...it, name } : it)));
  }
  function updateQty(i: number, quantity: number) {
    setDrafts((d) => d && d.map((it, j) => (j === i ? { ...it, quantity } : it)));
  }
  function removeRow(i: number) {
    setDrafts((d) => d && d.filter((_, j) => j !== i));
  }

  function save() {
    if (!drafts || drafts.length === 0) return;
    startSaving(async () => {
      try {
        await savePantryItems(drafts, "photo");
        toast.success(`Added ${drafts.length} item${drafts.length > 1 ? "s" : ""}`);
        onDone();
      } catch {
        toast.error("Couldn't save those items");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4 py-2">
      {!drafts &&
        (analyzing ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-border bg-secondary/40 px-6 py-10 text-center">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Reading your groceries…
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-destructive/40 bg-destructive/5 px-6 py-10 text-center">
            <ImageOff className="size-8 text-destructive" />
            <p className="font-medium">{error}</p>
            <Button variant="outline" onClick={() => setError(null)}>
              Try again
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setCameraOpen(true)}
            className="flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-border bg-secondary/40 px-6 py-10 text-center transition-colors hover:border-primary/50 hover:bg-accent/40"
          >
            <Camera className="size-8 text-primary" />
            <div>
              <p className="font-medium">Snap a receipt or groceries</p>
              <p className="text-sm text-muted-foreground">
                Opens the camera right here — no app switching.
              </p>
            </div>
          </button>
        ))}

      <CameraCaptureSheet
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={handleCapture}
      />

      {drafts && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            Found {drafts.length} item{drafts.length !== 1 ? "s" : ""}. Edit or
            remove any before adding.
          </p>
          <ul className="flex flex-col gap-2">
            {drafts.map((it, i) => (
              <li
                key={i}
                className="flex items-center gap-2 rounded-xl border bg-card p-2"
              >
                <span className="text-2xl" aria-hidden>
                  {it.icon_key}
                </span>
                <Input
                  value={it.name}
                  onChange={(e) => updateName(i, e.target.value)}
                  className="h-9 flex-1"
                />
                <Input
                  type="number"
                  min={0}
                  value={it.quantity}
                  onChange={(e) => updateQty(i, Number(e.target.value))}
                  className="h-9 w-16"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeRow(i)}
                  aria-label="Remove"
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setDrafts(null)}
            >
              Retake
            </Button>
            <Button className="flex-1" onClick={save} disabled={saving}>
              {saving ? "Adding…" : "Add to pantry"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ManualForm({ onDone }: { onDone: () => void }) {
  const [saving, startSaving] = useTransition();

  function action(formData: FormData) {
    startSaving(async () => {
      try {
        await addManualItem(formData);
        toast.success("Added to pantry");
        onDone();
      } catch {
        toast.error("Couldn't add that item");
      }
    });
  }

  return (
    <form action={action} className="flex flex-col gap-4 py-2">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Food</Label>
        <Input id="name" name="name" placeholder="e.g. Chicken breast" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="quantity">Quantity</Label>
          <Input
            id="quantity"
            name="quantity"
            type="number"
            min={0}
            defaultValue={1}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="unit">Unit</Label>
          <Input id="unit" name="unit" defaultValue="unit" />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="category">Category</Label>
        <select
          id="category"
          name="category"
          defaultValue="other"
          className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-base shadow-sm md:text-sm"
        >
          {FOOD_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="expires_at">Expires (optional)</Label>
        <Input id="expires_at" name="expires_at" type="date" />
      </div>
      <Button type="submit" disabled={saving}>
        {saving ? "Adding…" : "Add to pantry"}
      </Button>
    </form>
  );
}
