"use client";

import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Reactive `prefers-reduced-motion` (TASK-1701). `false` on the server AND
 * the first client render (hydration-safe — the <PlayerAge> seeding pattern),
 * then tracks the OS setting live via a matchMedia change listener.
 *
 * For imperative, non-reactive call sites (View Transition gate, autoplay
 * decisions) use `prefersReducedMotion()` from `@/utils/motion` instead.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const mql = window.matchMedia(QUERY);
    setReduced(mql.matches);
    const onChange = (event: MediaQueryListEvent | { matches: boolean }) =>
      setReduced(event.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return reduced;
}
