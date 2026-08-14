"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { saveGoals } from "@/app/app/macros/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  estimateGoals,
  type ActivityLevel,
  type GoalDirection,
} from "@/lib/macros";
import type { Macros } from "@/lib/types";

const DEFAULT_GOALS: Macros = {
  calories: 2000,
  protein_g: 150,
  carbs_g: 200,
  fat_g: 65,
};

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string; hint: string }[] = [
  { value: "sedentary", label: "Sedentary", hint: "Little to no exercise" },
  { value: "light", label: "Light", hint: "1–3 workouts a week" },
  { value: "moderate", label: "Moderate", hint: "3–5 workouts a week" },
  { value: "active", label: "Active", hint: "6–7 workouts a week" },
  { value: "very_active", label: "Very active", hint: "Physical job or daily training" },
];

const GOAL_OPTIONS: { value: GoalDirection; label: string; hint: string }[] = [
  { value: "lose", label: "Lose weight", hint: "A steady 500 kcal/day deficit" },
  { value: "maintain", label: "Maintain", hint: "Match what you burn" },
  { value: "gain", label: "Gain weight", hint: "A modest 300 kcal/day surplus" },
];

type Step = "welcome" | "about" | "goal" | "review";
const STEPS: Step[] = ["welcome", "about", "goal", "review"];

export function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("welcome");
  const [saving, startSaving] = useTransition();

  const [sex, setSex] = useState<"male" | "female">("female");
  const [age, setAge] = useState(30);
  const [heightCm, setHeightCm] = useState(170);
  const [weightKg, setWeightKg] = useState(70);
  const [activity, setActivity] = useState<ActivityLevel>("light");
  const [goal, setGoal] = useState<GoalDirection>("maintain");
  const [macros, setMacros] = useState<Macros>(DEFAULT_GOALS);

  const stepIndex = STEPS.indexOf(step);

  function goTo(next: Step) {
    setStep(next);
  }

  function useEstimate() {
    setMacros(estimateGoals({ sex, age, heightCm, weightKg, activity, goal }));
    goTo("review");
  }

  function skipToManual() {
    setMacros(DEFAULT_GOALS);
    goTo("review");
  }

  function finish() {
    const fd = new FormData();
    fd.set("calories", String(macros.calories));
    fd.set("protein_g", String(macros.protein_g));
    fd.set("carbs_g", String(macros.carbs_g));
    fd.set("fat_g", String(macros.fat_g));
    startSaving(async () => {
      try {
        await saveGoals(fd);
        router.push("/app");
      } catch {
        toast.error("Couldn't save your goals — try again.");
      }
    });
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      {step !== "welcome" && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
            style={{ width: `${(stepIndex / (STEPS.length - 1)) * 100}%` }}
          />
        </div>
      )}

      {step === "welcome" && (
        <div className="flex flex-col items-center gap-4 text-center">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Let&apos;s set up your kitchen
          </h1>
          <p className="text-sm text-muted-foreground">
            Two quick questions and we&apos;ll set daily calorie and macro
            goals you can fine-tune any time from the Macros tab.
          </p>
          <Button size="lg" className="w-full gap-2" onClick={() => goTo("about")}>
            Get started <ChevronRight className="size-4" />
          </Button>
          <button
            type="button"
            onClick={skipToManual}
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            I&apos;ll enter my numbers directly
          </button>
        </div>
      )}

      {step === "about" && (
        <div className="flex flex-col gap-5">
          <div>
            <h2 className="font-heading text-xl font-semibold tracking-tight">
              About you
            </h2>
            <p className="text-sm text-muted-foreground">
              Used only to estimate a calorie target — never shared.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {(["female", "male"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setSex(value)}
                aria-pressed={sex === value}
                className={cn(
                  "rounded-xl border px-4 py-2.5 text-sm font-medium capitalize transition-colors",
                  sex === value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card hover:bg-accent/40",
                )}
              >
                {value}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                min={13}
                max={100}
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="height">Height (cm)</Label>
              <Input
                id="height"
                type="number"
                min={100}
                max={250}
                value={heightCm}
                onChange={(e) => setHeightCm(Number(e.target.value))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                min={30}
                max={300}
                value={weightKg}
                onChange={(e) => setWeightKg(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="activity">Activity level</Label>
            <select
              id="activity"
              value={activity}
              onChange={(e) => setActivity(e.target.value as ActivityLevel)}
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
            >
              {ACTIVITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label} — {o.hint}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" size="lg" className="gap-2" onClick={() => goTo("welcome")}>
              <ChevronLeft className="size-4" /> Back
            </Button>
            <Button size="lg" className="flex-1 gap-2" onClick={() => goTo("goal")}>
              Next <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {step === "goal" && (
        <div className="flex flex-col gap-5">
          <div>
            <h2 className="font-heading text-xl font-semibold tracking-tight">
              What&apos;s your goal?
            </h2>
            <p className="text-sm text-muted-foreground">
              We&apos;ll adjust your calorie target accordingly.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            {GOAL_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => setGoal(o.value)}
                aria-pressed={goal === o.value}
                className={cn(
                  "flex flex-col gap-0.5 rounded-xl border px-4 py-3 text-left transition-colors",
                  goal === o.value
                    ? "border-primary bg-accent/60"
                    : "border-border bg-card hover:bg-accent/30",
                )}
              >
                <span className="font-medium">{o.label}</span>
                <span className="text-sm text-muted-foreground">{o.hint}</span>
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" size="lg" className="gap-2" onClick={() => goTo("about")}>
              <ChevronLeft className="size-4" /> Back
            </Button>
            <Button size="lg" className="flex-1 gap-2" onClick={useEstimate}>
              Next <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {step === "review" && (
        <div className="flex flex-col gap-5">
          <div>
            <h2 className="font-heading text-xl font-semibold tracking-tight">
              Your daily goals
            </h2>
            <p className="text-sm text-muted-foreground">
              A starting point — edit anything, or fine-tune later from the
              Macros tab.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="calories">Calories (kcal)</Label>
            <Input
              id="calories"
              type="number"
              min={0}
              value={macros.calories}
              onChange={(e) =>
                setMacros((m) => ({ ...m, calories: Number(e.target.value) }))
              }
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="protein">Protein (g)</Label>
              <Input
                id="protein"
                type="number"
                min={0}
                value={macros.protein_g}
                onChange={(e) =>
                  setMacros((m) => ({ ...m, protein_g: Number(e.target.value) }))
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="carbs">Carbs (g)</Label>
              <Input
                id="carbs"
                type="number"
                min={0}
                value={macros.carbs_g}
                onChange={(e) =>
                  setMacros((m) => ({ ...m, carbs_g: Number(e.target.value) }))
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="fat">Fat (g)</Label>
              <Input
                id="fat"
                type="number"
                min={0}
                value={macros.fat_g}
                onChange={(e) =>
                  setMacros((m) => ({ ...m, fat_g: Number(e.target.value) }))
                }
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              size="lg"
              className="gap-2"
              onClick={() => goTo("goal")}
              disabled={saving}
            >
              <ChevronLeft className="size-4" /> Back
            </Button>
            <Button size="lg" className="flex-1 gap-2" onClick={finish} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              {saving ? "Saving…" : "Finish"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
