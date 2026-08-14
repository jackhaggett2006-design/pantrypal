import Link from "next/link";
import { redirect } from "next/navigation";
import { Refrigerator, Target, ChefHat } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Refrigerator,
    title: "Snap & stock",
    body: "Photograph a receipt or your groceries. AI recognises each item and drops it onto your virtual fridge shelves.",
  },
  {
    icon: Target,
    title: "Track macros live",
    body: "Set calorie and macro goals, then watch your rings fill as you log meals through the day.",
  },
  {
    icon: ChefHat,
    title: "Cook what you have",
    body: "Get recipes matched to the ingredients you already own, with a hands-free step-by-step cooking guide.",
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
        <section className="flex flex-col items-center gap-6 py-16 text-center sm:py-24">
          <span className="rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-accent-foreground">
            Your kitchen, organised
          </span>
          <h1 className="max-w-3xl font-heading text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
            Snap your groceries. Track your macros. Cook what you have.
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground text-pretty">
            PantryPal turns a photo of your shopping into a living fridge, keeps
            your nutrition goals on track, and tells you exactly what you can
            make tonight.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/signup">Start free</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/login">I already have an account</Link>
            </Button>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 pb-24 sm:grid-cols-3">
          {features.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-2xl border bg-card p-6 shadow-sm"
            >
              <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                <Icon className="size-5" />
              </span>
              <h2 className="mt-4 font-medium">{title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
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
