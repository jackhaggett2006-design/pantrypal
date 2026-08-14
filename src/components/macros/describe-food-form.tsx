"use client";

import { useState, useTransition } from "react";
import { Loader2, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { parseFreeformFood, logFreeformItems } from "@/app/app/macros/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ParsedFoodItem } from "@/lib/vision";

export function DescribeFoodForm({ onDone }: { onDone: () => void }) {
  const [text, setText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [drafts, setDrafts] = useState<ParsedFoodItem[] | null>(null);
  const [saving, startSaving] = useTransition();

  async function parse() {
    if (!text.trim() || parsing) return;
    setParsing(true);
    setDrafts(null);
    const result = await parseFreeformFood(text);
    setParsing(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setDrafts(result.items);
  }

  function updateName(i: number, name: string) {
    setDrafts((d) => d && d.map((it, j) => (j === i ? { ...it, name } : it)));
  }
  function updateGrams(i: number, grams: number) {
    setDrafts((d) => d && d.map((it, j) => (j === i ? { ...it, grams } : it)));
  }
  function removeRow(i: number) {
    setDrafts((d) => d && d.filter((_, j) => j !== i));
  }

  function save() {
    if (!drafts || drafts.length === 0) return;
    startSaving(async () => {
      try {
        await logFreeformItems(drafts);
        toast.success(`Logged ${drafts.length} item${drafts.length > 1 ? "s" : ""}`);
        onDone();
      } catch {
        toast.error("Couldn't log that");
      }
    });
  }

  if (drafts) {
    return (
      <div className="flex flex-col gap-3 py-2">
        <p className="text-sm text-muted-foreground">
          Here&apos;s what we heard. Edit or remove anything before logging.
        </p>
        <ul className="flex flex-col gap-2">
          {drafts.map((it, i) => (
            <li key={i} className="flex items-center gap-2 rounded-xl border bg-card p-2">
              <Input
                value={it.name}
                onChange={(e) => updateName(i, e.target.value)}
                className="h-9 flex-1"
              />
              <Input
                type="number"
                min={0}
                value={it.grams}
                onChange={(e) => updateGrams(i, Number(e.target.value))}
                className="h-9 w-20"
              />
              <span className="text-xs text-muted-foreground">g</span>
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
          <Button variant="outline" className="flex-1" onClick={() => setDrafts(null)}>
            Start over
          </Button>
          <Button
            className="flex-1"
            onClick={save}
            disabled={saving || drafts.length === 0}
          >
            {saving ? "Logging…" : "Log it"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 py-2">
      <p className="text-sm text-muted-foreground">
        Describe what you ate, in your own words.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            parse();
          }
        }}
        placeholder="e.g. two scrambled eggs, a slice of toast with butter, and a coffee with milk"
        rows={3}
        autoFocus
        className="w-full resize-none rounded-xl border border-input bg-transparent px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <Button onClick={parse} disabled={parsing || !text.trim()} className="gap-2">
        {parsing ? (
          <>
            <Loader2 className="size-4 animate-spin" /> Reading that…
          </>
        ) : (
          <>
            <Sparkles className="size-4" /> Break it down
          </>
        )}
      </Button>
    </div>
  );
}
