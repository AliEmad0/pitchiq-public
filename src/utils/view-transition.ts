// Native View Transitions API helpers (TASK-910). Zero bundle cost, no deps.
// prefersReducedMotion moved to the motion foundation (TASK-1701) — re-exported
// here so existing importers keep working.

import { prefersReducedMotion } from "./motion";

export { prefersReducedMotion };

type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void | Promise<unknown>) => unknown;
};

/**
 * Run a DOM-updating callback inside a native View Transition when supported,
 * else apply it instantly. The callback may return a promise (e.g. a nuqs
 * setter that resolves after the router re-render) — the API awaits it before
 * snapshotting the "after" state, so the morph reflects the updated UI.
 *
 * Skipped (instant) when the API is missing OR the user prefers reduced motion,
 * which satisfies the accessibility contract without relying on the browser's
 * own (uneven) reduced-motion handling.
 */
export function runViewTransition(update: () => void | Promise<unknown>): void {
  const doc = typeof document !== "undefined" ? (document as ViewTransitionDocument) : undefined;
  if (doc?.startViewTransition && !prefersReducedMotion()) {
    doc.startViewTransition(() => update());
  } else {
    void update();
  }
}
