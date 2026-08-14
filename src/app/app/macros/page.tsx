import { getRecentMeals } from "@/app/app/macros/actions";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { MacroTracker } from "@/components/macros/tracker";
import { GoalsDialog } from "@/components/macros/goals-dialog";
import { QuickLogFab } from "@/components/macros/quick-log-fab";
import { IntakeList } from "@/components/macros/intake-list";
import { sumMacros, todayUtc } from "@/lib/macros";
import type { IntakeEntry, MacroGoals, PantryItem } from "@/lib/types";

const DEFAULT_GOALS = { calories: 2000, protein_g: 150, carbs_g: 200, fat_g: 65 };

export default async function MacrosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: goalsRow }, { data: intakeRows }, { data: pantryRows }, recentMeals] =
    await Promise.all([
      supabase.from("macro_goals").select("*").eq("user_id", user!.id).maybeSingle(),
      supabase
        .from("intake_log")
        .select("*")
        .eq("logged_on", todayUtc())
        .order("created_at", { ascending: false }),
      supabase
        .from("pantry_items")
        .select("*")
        .order("added_at", { ascending: false }),
      getRecentMeals(),
    ]);

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

  return (
    <div className="flex flex-col gap-6 pb-16">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Macros"
          subtitle="Today's goals, tracked live as you log food."
        />
        <GoalsDialog goals={goals} />
      </div>

      <MacroTracker goals={goals} totals={totals} />

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-muted-foreground">
          Logged today
        </h2>
        <IntakeList entries={entries} />
      </div>

      <QuickLogFab pantryItems={pantryItems} recentMeals={recentMeals} />
    </div>
  );
}
