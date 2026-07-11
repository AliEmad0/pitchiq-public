"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { settleArrival } from "@/utils/route-transition";

/**
 * TASK-1703 — settles the in-flight route-transition arrival promise once the
 * new route has committed (the clicked <TransitionLink> may unmount with the
 * old page, so this persistent layout child owns the signal). Keyed on
 * pathname + searchParams so query-only navigations (`?season=` links) count.
 * Reads useSearchParams → must mount inside <Suspense> (the AppShell gotcha).
 */
export function RouteTransitionArrival() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    settleArrival();
  }, [pathname, searchParams]);

  return null;
}
