import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { FridgeView } from "@/components/fridge/fridge-view";
import { AddToFridge } from "@/components/fridge/add-to-fridge";
import { Card, CardContent } from "@/components/ui/card";
import type { PantryItem } from "@/lib/types";

export default async function FridgePage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("pantry_items")
    .select("*")
    .order("added_at", { ascending: false });

  const items = (data ?? []) as PantryItem[];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="My Pantry"
          subtitle={
            items.length
              ? `${items.length} item${items.length !== 1 ? "s" : ""} in stock`
              : "Everything you have on hand, at a glance."
          }
        />
        <AddToFridge />
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="grid place-items-center gap-2 py-16 text-center">
            <span className="text-4xl">🧊</span>
            <p className="font-medium">Your pantry is empty</p>
            <p className="max-w-xs text-sm text-muted-foreground">
              Tap <span className="font-medium">Add food</span> and snap a photo
              of your groceries — items will appear on the shelves.
            </p>
          </CardContent>
        </Card>
      ) : (
        <FridgeView items={items} />
      )}
    </div>
  );
}
