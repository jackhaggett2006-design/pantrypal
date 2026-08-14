import Link from "next/link";
import { ChefHat, ChevronRight, Target, TriangleAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AddToFridge } from "@/components/fridge/add-to-fridge";
import { MacroTracker } from "@/components/macros/tracker";
import { getExpiryStatus, expiryLabel } from "@/lib/expiry";
import { sumMacros, todayUtc } from "@/lib/macros";
import type { IntakeEntry, MacroGoals, PantryItem } from "@/lib/types";

const DEFAULT_GOALS = { calories: 2000, protein_g: 150, carbs_g: 200, fat_g: 65 };

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: goalsRow }, { data: intakeRows }, { data: pantryRows }] =
    await Promise.all([
      supabase.from("profiles").select("display_name").eq("id", user!.id).maybeSingle(),
      supabase.from("macro_goals").select("*").eq("user_id", user!.id).maybeSingle(),
      supabase
        .from("intake_log")
        .select("*")
        .eq("logged_on", todayUtc())
        .order("created_at", { ascending: false }),
      supabase.from("pantry_items").select("*").order("added_at", { ascending: false }),
    ]);

  const name = profile?.display_name ?? "there";
  const goals: MacroGoals = (goalsRow as MacroGoals | null) ?? {
    user_id: user!.id,
    ...DEFAULT_GOALS,
    updated_at: new Date().toISOString(),
  };
  const entries = (intakeRows ?? []) as IntakeEntry[];
  const pantryItems = (pantryRows ?? []) as PantryItem[];
  const totals = sumMacros(
    entries.map((e) => ({
      calories: e.calories,
      protein_g: e.protein_g,
      carbs_g: e.carbs_g,
      fat_g: e.fat_g,
    })),
  );

  const expiringSoon = pantryItems
    .filter((it) => {
      const status = getExpiryStatus(it.expires_at);
      return status === "today" || status === "soon" || status === "expired";
    })
    .slice(0, 4);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm text-muted-foreground">Welcome back</p>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Hi {name} 👋
        </h1>
      </div>

      <MacroTracker goals={goals} totals={totals} />

      <div className="rounded-2xl border bg-card p-4">
        <div className="flex items-center justify-between gap-3">
          <Link href="/app/pantry" className="flex items-center gap-1.5 font-semibold">
            Pantry <ChevronRight className="size-4 text-muted-foreground" />
          </Link>
          <span className="text-sm text-muted-foreground">
            {pantryItems.length} item{pantryItems.length !== 1 ? "s" : ""}
          </span>
        </div>

        {expiringSoon.length > 0 ? (
          <ul className="mt-3 flex flex-col gap-1.5">
            {expiringSoon.map((item) => (
              <li key={item.id} className="flex items-center gap-2 text-sm">
                <span aria-hidden>{item.icon_key ?? "🍽️"}</span>
                <span className="min-w-0 flex-1 truncate">{item.name}</span>
                <span
                  className="flex items-center gap-1 text-xs font-semibold"
                  style={{ color: "var(--status-warning)" }}
                >
                  <TriangleAlert className="size-3" />
                  {item.expires_at ? expiryLabel(item.expires_at) : ""}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            {pantryItems.length === 0
              ? "Nothing in stock yet — snap your groceries below."
              : "Nothing expiring soon."}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-muted-foreground">Quick actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <AddToFridge />
          <Link
            href="/app/cookbook"
            className="flex items-center justify-center gap-2 rounded-lg border bg-card px-4 py-2 text-sm font-medium transition-shadow hover:shadow-md"
          >
            <ChefHat className="size-4 text-primary" /> What can I make?
          </Link>
        </div>
        <Link
          href="/app/macros"
          className="flex items-center justify-center gap-2 rounded-lg border bg-card px-4 py-2 text-sm font-medium transition-shadow hover:shadow-md"
        >
          <Target className="size-4 text-primary" /> Log food to today&apos;s macros
        </Link>
      </div>
    </div>
  );
}
