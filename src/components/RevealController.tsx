"use client";

import { useReveal } from "@/hooks/useReveal";

/**
 * TASK-1704 — null-render layout island (the <ScrollToTop> pattern) that runs
 * the soft-rise reveal controller. Mounted once in [locale]/layout.tsx; the
 * markup opt-in is `{...revealProps(i)}` (src/utils/reveal.ts) and the motion
 * itself is pure CSS in globals.css.
 */
export function RevealController() {
  useReveal();
  return null;
}
