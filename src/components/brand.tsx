import Link from "next/link";
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
        className="grid size-8 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm"
      >
        🥗
      </span>
      <span>PantryPal</span>
    </Link>
  );
}
