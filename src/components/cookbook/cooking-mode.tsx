"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, PartyPopper, Pause, Play, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isEmojiIcon } from "@/lib/recipe-match";
import type { RecipeStep } from "@/lib/types";

export function CookingMode({
  recipeId,
  title,
  icon,
  steps,
}: {
  recipeId: string;
  title: string;
  icon: string | null;
  steps: RecipeStep[];
}) {
  const router = useRouter();
  const [index, setIndex] = useState(0);

  if (steps.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-muted-foreground">This recipe has no steps yet.</p>
        <Button asChild variant="outline">
          <Link href={`/app/cookbook/${recipeId}`}>Back to recipe</Link>
        </Button>
      </div>
    );
  }

  const step = steps[index];
  const isFirst = index === 0;
  const isLast = index === steps.length - 1;

  return (
    <div className="flex min-h-[70vh] flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
          <span aria-hidden>{isEmojiIcon(icon) ? icon : "🍽️"}</span>
          <span className="truncate">{title}</span>
        </div>
        <Button asChild variant="ghost" size="icon" aria-label="Exit cooking mode">
          <Link href={`/app/cookbook/${recipeId}`}>
            <X className="size-4" />
          </Link>
        </Button>
      </div>

      {/* progress */}
      <div className="flex flex-col gap-1.5">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
            style={{ width: `${((index + 1) / steps.length) * 100}%` }}
          />
        </div>
        <p className="text-xs font-medium text-muted-foreground">
          Step {index + 1} of {steps.length}
        </p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-6 rounded-2xl border bg-card px-6 py-12 text-center">
        <p className="text-balance text-2xl font-medium leading-snug sm:text-3xl">
          {step.text}
        </p>
        {typeof step.minutes === "number" && step.minutes > 0 && (
          <StepTimer minutes={step.minutes} />
        )}
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          size="lg"
          className="flex-1 gap-2"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={isFirst}
        >
          <ChevronLeft className="size-5" /> Back
        </Button>
        {isLast ? (
          <Button
            size="lg"
            className="flex-1 gap-2"
            onClick={() => router.push(`/app/cookbook/${recipeId}`)}
          >
            <PartyPopper className="size-5" /> Done
          </Button>
        ) : (
          <Button
            size="lg"
            className="flex-1 gap-2"
            onClick={() => setIndex((i) => Math.min(steps.length - 1, i + 1))}
          >
            Next <ChevronRight className="size-5" />
          </Button>
        )}
      </div>
    </div>
  );
}

function StepTimer({ minutes }: { minutes: number }) {
  const [secondsLeft, setSecondsLeft] = useState(minutes * 60);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    if (secondsLeft <= 0) {
      setRunning(false);
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [running, secondsLeft]);

  const mm = Math.floor(secondsLeft / 60)
    .toString()
    .padStart(2, "0");
  const ss = (secondsLeft % 60).toString().padStart(2, "0");
  const done = secondsLeft === 0;

  return (
    <div className="flex flex-col items-center gap-3">
      <span
        className="text-4xl font-semibold tabular-nums"
        style={{ color: done ? "var(--status-warning)" : undefined }}
      >
        {mm}:{ss}
      </span>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="secondary"
          size="icon"
          onClick={() => setRunning((r) => !r)}
          disabled={done}
          aria-label={running ? "Pause timer" : "Start timer"}
        >
          {running ? <Pause className="size-4" /> : <Play className="size-4" />}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          onClick={() => {
            setRunning(false);
            setSecondsLeft(minutes * 60);
          }}
          aria-label="Reset timer"
        >
          <RotateCcw className="size-4" />
        </Button>
      </div>
    </div>
  );
}
