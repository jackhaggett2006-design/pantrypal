import Link from "next/link";
import { cn } from "@/lib/utils";

/** The app's own mark: a fridge door with a handle and two shelf lines —
 * a small echo of the literal fridge shelves in <FridgeView>, drawn in the
 * same stroke style as the lucide icons used everywhere else in the nav. */
function FridgeMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect x="5.5" y="2.5" width="13" height="19" rx="2.6" />
      <line x1="15.5" y1="5.5" x2="15.5" y2="9" />
      <line x1="7.8" y1="12.7" x2="15" y2="12.7" />
      <line x1="7.8" y1="16.4" x2="15" y2="16.4" />
    </svg>
  );
}

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
        <FridgeMark className="size-4.5" />
      </span>
      <span>PantryPal</span>
    </Link>
  );
}
