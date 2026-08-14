import Link from "next/link";
import { Refrigerator, Target, ChefHat, Camera } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";

const shortcuts = [
  {
    href: "/app/fridge",
    title: "My Fridge",
    description: "See what's in stock",
    icon: Refrigerator,
  },
  {
    href: "/app/macros",
    title: "Macros",
    description: "Track today's goals",
    icon: Target,
  },
  {
    href: "/app/cookbook",
    title: "Cookbook",
    description: "Cook what you have",
    icon: ChefHat,
  },
] as const;

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user!.id)
    .maybeSingle();

  const name = profile?.display_name ?? "there";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm text-muted-foreground">Welcome back</p>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Hi {name} 👋
        </h1>
      </div>

      <Link href="/app/fridge">
        <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 to-accent/40 transition-shadow hover:shadow-md">
          <CardContent className="flex items-center gap-4 py-5">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <Camera className="size-6" />
            </span>
            <div>
              <p className="font-medium">Snap your groceries</p>
              <p className="text-sm text-muted-foreground">
                Photograph a receipt or the table and we&apos;ll stock your
                fridge.
              </p>
            </div>
          </CardContent>
        </Card>
      </Link>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {shortcuts.map(({ href, title, description, icon: Icon }) => (
          <Link key={href} href={href}>
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardContent className="flex flex-col gap-2 py-5">
                <Icon className="size-5 text-primary" />
                <div>
                  <p className="font-medium">{title}</p>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
