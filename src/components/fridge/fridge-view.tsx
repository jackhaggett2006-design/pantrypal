"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { deletePantryItem } from "@/app/app/fridge/actions";
import { expiryLabel, getExpiryStatus } from "@/lib/expiry";
import { CATEGORY_TINT } from "@/lib/food-icons";
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
      <div className="relative rounded-[2rem] border border-primary/15 bg-gradient-to-b from-card to-secondary p-3 shadow-md">
        {/* door handle */}
        <div className="absolute -right-1 top-1/2 h-24 w-2 -translate-y-1/2 rounded-full bg-primary/70" />
        <div className="flex flex-col gap-3 rounded-[1.4rem] bg-background/70 p-3">
          {shelves.map((shelf, i) => (
            <div
              key={i}
              className="min-h-24 rounded-xl border border-primary/10 bg-gradient-to-b from-card to-secondary/60 p-2.5"
            >
              <div className="flex flex-wrap items-start gap-2.5">
                <AnimatePresence mode="popLayout">
                  {shelf.map((item) => (
                    <FridgeItem key={item.id} item={item} />
                  ))}
                </AnimatePresence>
              </div>
              {/* shelf lip: a little glass-shelf glint under the items */}
              <div className="mt-2.5 h-1 rounded-full bg-gradient-to-r from-primary/5 via-primary/25 to-primary/5" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const TAP_REVEAL_MS = 2500;

function FridgeItem({ item }: { item: PantryItem }) {
  const [pending, startTransition] = useTransition();
  const [hovered, setHovered] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
  }, []);

  function revealBriefly() {
    setHovered(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setHovered(false), TAP_REVEAL_MS);
  }

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
  const [tintFrom, tintTo] = CATEGORY_TINT[item.category ?? "other"];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -24, scale: 0.8 }}
      animate={{ opacity: pending ? 0.4 : 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.6, y: 10 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onTapStart={revealBriefly}
      className="group relative flex w-[4.5rem] flex-col items-center gap-1 rounded-2xl p-2.5 text-center shadow-[0_2px_0_rgba(0,0,0,0.04),0_6px_10px_-4px_rgba(74,55,40,0.25)]"
      style={{
        backgroundImage: `linear-gradient(160deg, ${tintFrom}, ${tintTo})`,
      }}
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
      <span className="text-4xl leading-none drop-shadow-sm" aria-hidden>
        {item.icon_key ?? "🍽️"}
      </span>
      <span className="line-clamp-2 text-[11px] font-semibold leading-tight text-[#3a2e22]">
        {item.name}
      </span>
      {expiryStatus && label && (
        <span
          className="rounded-full bg-black/10 px-1.5 py-0.5 text-[9px] font-semibold leading-none text-[#3a2e22]"
          style={{
            color: expiryStatus === "expired" ? "var(--destructive)" : undefined,
          }}
        >
          {label}
        </span>
      )}
      {/* grounding shadow: settles the item onto the glass shelf */}
      <span
        aria-hidden
        className="absolute -bottom-1.5 left-1/2 h-1.5 w-10 -translate-x-1/2 rounded-full bg-black/15 blur-[3px]"
      />
    </motion.div>
  );
}
