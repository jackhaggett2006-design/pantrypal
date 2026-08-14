import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";

export default function FridgePage() {
  return (
    <div>
      <PageHeader
        title="My Fridge"
        subtitle="Everything you have on hand, at a glance."
      />
      <Card>
        <CardContent className="grid place-items-center gap-2 py-16 text-center">
          <span className="text-4xl">🧊</span>
          <p className="font-medium">Your fridge is empty</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Coming next: snap a photo of your groceries and watch items appear
            on the shelves.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
