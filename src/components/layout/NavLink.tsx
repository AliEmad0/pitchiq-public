"use client";

import { Link, usePathname } from "@/i18n/navigation";

import { cn } from "@/utils/cn";
import { withSeason } from "@/utils/season";

type Props = {
  href: string;
  // The active `?season=` (raw string from the URL, or null). Appended to the
  // link so navigating between sections preserves the viewed season. Active-
  // state matching still uses the bare `href` (path only).
  season?: string | null;
  children: React.ReactNode;
};

// Active-link styling for the primary nav. Exact match on "/" (otherwise every
// route would match the Dashboard link); prefix match for nested routes like
// /teams/33 → /teams.
export function NavLink({ href, season, children }: Props) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
  const seasonNum = season ? Number.parseInt(season, 10) : NaN;
  const linkHref = Number.isFinite(seasonNum) ? withSeason(href, seasonNum) : href;

  return (
    <Link
      href={linkHref}
      aria-current={active ? "page" : undefined}
      className={cn(
        "ix-glow inline-flex h-9 items-center rounded-md px-3 text-sm font-medium",
        active
          ? "bg-accent text-accent-foreground"
          : "text-foreground/70 hover:bg-accent/50 hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}
