// Motion foundation (TASK-1701). CSS is the source of truth for token VALUES
// (src/app/globals.css); this module is the JS mirror for Motion configs and
// imperative timing. tests/unit/motion-tokens.test.ts guarantees parity.

/** Durations in ms — mirrors `--motion-duration-*` in globals.css. */
export const MOTION_DURATION = {
  /** Hover/press, color/opacity transitions. */
  fast: 150,
  /** Entrances, slides. */
  base: 300,
  /** Emphasis pulses, loader beats. */
  slow: 600,
} as const;

/** Cubic-bezier control points — mirrors the `--ease-*` tokens in globals.css.
 * Tuple form is what the Motion library takes; `cssEase` gives the CSS string. */
export const MOTION_EASE = {
  /** Decelerating entrance. */
  outSoft: [0.25, 1, 0.5, 1],
  /** Symmetric move. */
  inOutSoft: [0.45, 0, 0.55, 1],
  /** Slight overshoot — playful pops (slot-fill, badges). */
  pop: [0.34, 1.56, 0.64, 1],
} as const;

/** CSS string form of an easing tuple. */
export function cssEase(points: readonly number[]): string {
  return `cubic-bezier(${points.join(", ")})`;
}

/** SSR-safe `prefers-reduced-motion: reduce` check (canonical home; the
 * view-transition module re-exports it). For REACTIVE consumers use the
 * `useReducedMotion` hook instead. */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** Lazy entry point for the Motion library (imperative `animate`, etc.).
 * NEVER import "motion" statically from production code — this dynamic import
 * keeps it out of every page's First Load JS until a consumer actually runs.
 * React components should instead be wrapped with `next/dynamic` + `ssr:false`
 * (the `ComparisonRadarLazy` pattern) and import "motion/react" inside the
 * lazy chunk. See docs/motion.md. */
export async function loadMotion(): Promise<typeof import("motion")> {
  return import("motion");
}
