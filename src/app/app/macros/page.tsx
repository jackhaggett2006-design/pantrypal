import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";

export default function MacrosPage() {
  return (
    <div>
      <PageHeader
        title="Macros"
        subtitle="Set your goals and track them live throughout the day."
      />
      <Card>
        <CardContent className="grid place-items-center gap-2 py-16 text-center">
          <span className="text-4xl">🎯</span>
          <p className="font-medium">No goals set yet</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Coming next: set calorie and macro targets and watch your rings fill
            as you log food.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
