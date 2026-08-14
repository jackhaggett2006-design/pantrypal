import Link from "next/link";
import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

export function Brand({
  className,
  href = "/",
}: {
  className?: string;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 font-heading text-lg font-semibold tracking-tight",
        className,
      )}
    >
      <span
        aria-hidden
        className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm"
      >
        <Flame className="size-5" strokeWidth={2.4} />
      </span>
      <span>PantryPal</span>
    </Link>
  );
}
