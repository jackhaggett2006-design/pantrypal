"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Refrigerator, Target, ChefHat, Plus } from "lucide-react";
import { LogFoodDialog } from "@/components/macros/log-food-dialog";
import { cn } from "@/lib/utils";

const leftTabs = [
  { href: "/app", label: "Home", icon: Home },
  { href: "/app/pantry", label: "Pantry", icon: Refrigerator },
] as const;

const rightTabs = [
  { href: "/app/macros", label: "Macros", icon: Target },
  { href: "/app/cookbook", label: "Cookbook", icon: ChefHat },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/app") return pathname === "/app";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppNav() {
  const pathname = usePathname();
  const [logOpen, setLogOpen] = useState(false);

  return (
    <>
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70"
      >
        <ul className="mx-auto flex max-w-2xl items-stretch justify-around px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
          {leftTabs.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <li key={href} className="flex-1">
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-lg py-1.5 text-xs font-medium transition-colors",
                    active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="size-5" strokeWidth={active ? 2.4 : 1.8} />
                  {label}
                </Link>
              </li>
            );
          })}

          {/* Raised quick-log button, merged into the bar itself rather than
           * floating separately above it. */}
          <li className="flex flex-1 justify-center">
            <button
              type="button"
              onClick={() => setLogOpen(true)}
              aria-label="Log food"
              className="-mt-5 grid size-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 ring-4 ring-background transition-transform active:scale-90"
            >
              <Plus className="size-6" strokeWidth={2.4} />
            </button>
          </li>

          {rightTabs.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <li key={href} className="flex-1">
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-lg py-1.5 text-xs font-medium transition-colors",
                    active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="size-5" strokeWidth={active ? 2.4 : 1.8} />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <LogFoodDialog open={logOpen} onOpenChange={setLogOpen} />
    </>
  );
}
