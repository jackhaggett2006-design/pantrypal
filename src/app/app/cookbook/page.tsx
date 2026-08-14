import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";

export default function CookbookPage() {
  return (
    <div>
      <PageHeader
        title="Cookbook"
        subtitle="Recipes you can actually make with what's in your fridge."
      />
      <Card>
        <CardContent className="grid place-items-center gap-2 py-16 text-center">
          <span className="text-4xl">📖</span>
          <p className="font-medium">No recipes yet</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Coming next: tap &ldquo;What can I make?&rdquo; and we&apos;ll match
            recipes to your ingredients, with step-by-step cooking mode.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
