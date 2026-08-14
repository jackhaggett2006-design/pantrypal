import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { FridgeView } from "@/components/fridge/fridge-view";
import type { PantryItem } from "@/lib/types";

function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

// A hand-picked shelf for the landing page — not live data, just enough
// variety (categories, expiry states) to show what the real fridge does
// instead of describing it in a bullet point.
const DEMO_ITEMS: PantryItem[] = [
  { id: "d1", user_id: "demo", name: "Whole milk", icon_key: "🥛", quantity: 1, unit: "carton", category: "dairy", fdc_id: null, macros_per_100g: null, source: "manual", added_at: "", expires_at: daysFromNow(2) },
  { id: "d2", user_id: "demo", name: "Eggs", icon_key: "🥚", quantity: 12, unit: "unit", category: "dairy", fdc_id: null, macros_per_100g: null, source: "manual", added_at: "", expires_at: daysFromNow(9) },
  { id: "d3", user_id: "demo", name: "Spinach", icon_key: "🥬", quantity: 1, unit: "bag", category: "produce", fdc_id: null, macros_per_100g: null, source: "manual", added_at: "", expires_at: daysFromNow(0) },
  { id: "d4", user_id: "demo", name: "Chicken breast", icon_key: "🍗", quantity: 2, unit: "unit", category: "meat", fdc_id: null, macros_per_100g: null, source: "manual", added_at: "", expires_at: daysFromNow(2) },
  { id: "d5", user_id: "demo", name: "Blueberries", icon_key: "🫐", quantity: 1, unit: "punnet", category: "produce", fdc_id: null, macros_per_100g: null, source: "manual", added_at: "", expires_at: daysFromNow(1) },
  { id: "d6", user_id: "demo", name: "Sourdough", icon_key: "🍞", quantity: 1, unit: "loaf", category: "bakery", fdc_id: null, macros_per_100g: null, source: "manual", added_at: "", expires_at: null },
  { id: "d7", user_id: "demo", name: "Greek yogurt", icon_key: "🥣", quantity: 1, unit: "tub", category: "dairy", fdc_id: null, macros_per_100g: null, source: "manual", added_at: "", expires_at: daysFromNow(6) },
];

const STEPS = [
  {
    title: "Snap what you bought",
    body: "One photo of the receipt or the bags on the counter — no manual entry.",
  },
  {
    title: "It lands on the shelf, dated",
    body: "Every item gets an icon, a category, and an expiry countdown automatically.",
  },
  {
    title: "Cook from what's already there",
    body: "Recipes are ranked by what you have, what's about to expire, and what's left in today's macros.",
  },
];

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/app");
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-5">
        <Brand />
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Get started</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6">
        <section className="grid grid-cols-1 items-center gap-10 py-14 sm:py-20 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div className="flex flex-col items-start gap-6 text-left">
            <h1 className="font-heading text-4xl font-black tracking-tight text-balance sm:text-5xl">
              Your pantry, but it knows what&apos;s in it.
            </h1>
            <p className="max-w-md text-lg text-muted-foreground text-pretty">
              Photograph your groceries once. PantryPal stocks the shelves,
              tracks what&apos;s about to go off, and tells you exactly what
              to cook with it tonight.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/signup">Start free</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/login">I already have an account</Link>
              </Button>
            </div>
          </div>

          <div aria-hidden className="pointer-events-none">
            <FridgeView items={DEMO_ITEMS} />
          </div>
        </section>

        <section className="pb-20 sm:pb-28">
          <p className="mb-4 text-center text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">
            How it actually works
          </p>
          <div className="mx-auto max-w-md overflow-hidden rounded-2xl border-2 border-foreground bg-card">
            {STEPS.map((step, i) => (
              <div
                key={step.title}
                className={
                  i < STEPS.length - 1
                    ? "flex gap-4 border-b border-dashed border-border px-5 py-4"
                    : "flex gap-4 px-5 py-4"
                }
              >
                <span className="font-mono text-lg font-black tabular-nums text-primary">
                  0{i + 1}
                </span>
                <div>
                  <p className="font-semibold">{step.title}</p>
                  <p className="text-sm text-muted-foreground">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto w-full max-w-5xl px-6 py-6 text-sm text-muted-foreground">
          PantryPal — built with Next.js, Supabase &amp; Claude.
        </div>
      </footer>
    </div>
  );
}
