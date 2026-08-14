"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { deletePantryItem } from "@/app/app/fridge/actions";
import { expiryLabel, getExpiryStatus } from "@/lib/expiry";
import type { PantryItem } from "@/lib/types";
import { cn } from "@/lib/utils";

const PER_SHELF = 4;

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export function FridgeView({ items }: { items: PantryItem[] }) {
  // Always render at least 3 shelves so the fridge looks like a fridge.
  const shelves = chunk(items, PER_SHELF);
  while (shelves.length < 3) shelves.push([]);

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="relative rounded-[2rem] border border-border bg-gradient-to-b from-secondary to-muted p-3 shadow-sm">
        {/* door handle */}
        <div className="absolute -right-1 top-1/2 h-24 w-2 -translate-y-1/2 rounded-full bg-border" />
        <div className="flex flex-col gap-3 rounded-[1.4rem] bg-background/60 p-3">
          {shelves.map((shelf, i) => (
            <div
              key={i}
              className="min-h-24 rounded-xl border border-border/60 bg-gradient-to-b from-background to-secondary/40 p-2"
            >
              <div className="flex flex-wrap items-start gap-2">
                <AnimatePresence mode="popLayout">
                  {shelf.map((item) => (
                    <FridgeItem key={item.id} item={item} />
                  ))}
                </AnimatePresence>
              </div>
              {/* shelf lip */}
              <div className="mt-2 h-1 rounded-full bg-border/70" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FridgeItem({ item }: { item: PantryItem }) {
  const [pending, startTransition] = useTransition();
  const [hovered, setHovered] = useState(false);

  function remove() {
    startTransition(async () => {
      try {
        await deletePantryItem(item.id);
        toast.success(`Removed ${item.name}`);
      } catch {
        toast.error("Couldn't remove that item");
      }
    });
  }

  const expiryStatus = getExpiryStatus(item.expires_at);
  const label = item.expires_at ? expiryLabel(item.expires_at) : null;
  const title = label ? `${item.name} — ${label}` : item.name;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -24, scale: 0.8 }}
      animate={{ opacity: pending ? 0.4 : 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.6, y: 10 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onTapStart={() => setHovered((h) => !h)}
      className="group relative flex w-16 flex-col items-center gap-1 rounded-xl bg-card p-2 text-center shadow-sm"
      title={title}
    >
      <button
        type="button"
        onClick={remove}
        aria-label={`Remove ${item.name}`}
        className={cn(
          "absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-destructive text-white shadow transition-opacity",
          hovered ? "opacity-100" : "opacity-0 group-hover:opacity-100",
        )}
      >
        <X className="size-3" />
      </button>
      <span className="text-3xl leading-none" aria-hidden>
        {item.icon_key ?? "🍽️"}
      </span>
      <span className="line-clamp-2 text-[11px] font-medium leading-tight text-foreground">
        {item.name}
      </span>
      {expiryStatus && label && (
        <span
          className="text-[9px] font-semibold leading-none"
          style={{
            color:
              expiryStatus === "expired"
                ? "var(--destructive)"
                : "var(--status-warning)",
          }}
        >
          {label}
        </span>
      )}
    </motion.div>
  );
}
