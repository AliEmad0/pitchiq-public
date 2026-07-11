"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Reset the window scroll to the top on every route (pathname) change.
 *
 * Next's App Router is meant to scroll to the top on navigation, but it doesn't
 * do so reliably across every navigation source here (link clicks, the ⌘K
 * palette's `router.push`, the mobile drawer), so a deep page opened from a
 * scrolled list kept the old scroll offset. Keying the effect on `pathname`
 * ONLY (not search params) means a query-only change — the season switcher, a
 * table filter — does NOT jump to the top, which would be jarring mid-filter.
 *
 * Uses `next/navigation`'s raw `usePathname` (the full `/ar/...` path) rather
 * than the locale-aware one so a locale switch also resets. Renders nothing.
 */
export function ScrollToTop() {
  const pathname = usePathname();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
