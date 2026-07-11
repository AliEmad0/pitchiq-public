import type { CSSProperties } from "react";

/**
 * TASK-1704 — soft-rise entrance/scroll reveal (owner pick #1 of 20).
 * Single source of truth for the reveal attribute names shared by the inline
 * gate script (layout), the CSS in globals.css, the <RevealController>
 * island, and the tests.
 */

/** Stamped on <html> BEFORE first paint by REVEAL_GATE_SCRIPT — only when JS
 * is running, IntersectionObserver exists, and reduced motion is off. Every
 * hidden state in CSS is scoped under it, so no-JS/reduced-motion visitors
 * never see hidden content. */
export const REVEAL_READY_ATTR = "data-reveal-ready";

/** Stamped on <html> by the controller on mount. Disarms the CSS failsafe
 * (which auto-plays the reveal if hydration dies after the gate stamped). */
export const REVEAL_LIVE_ATTR = "data-reveal-live";

/** Opt-in marker on the elements that reveal (server or client markup). */
export const REVEAL_TARGET_ATTR = "data-reveal";

/** Set by the controller via the DOM when the element enters the viewport.
 * NEVER render this from React — a client re-render would reset it and
 * re-hide the element forever (the TASK-1702 React-managed-DOM lesson). */
export const REVEAL_DONE_ATTR = "data-revealed";

/** Pre-paint gate (the era-no-flash / boot-once pattern): hidden states only
 * ever apply when this stamp succeeded, so the reveal can never brick a
 * no-JS, reduced-motion, or IO-less visit. */
export const REVEAL_GATE_SCRIPT = `(function(){try{
if(typeof IntersectionObserver!=="undefined"&&!matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.setAttribute("${REVEAL_READY_ATTR}","");
}catch(_){}})();`;

export interface RevealProps {
  "data-reveal": "";
  style?: CSSProperties;
}

/**
 * Spread onto an element to opt it into the reveal: `{...revealProps(i)}`.
 * `index` is the element's position within its group — CSS staggers by
 * 45ms per step (capped at 12). Elements that already carry an inline
 * `style` must merge manually: `style={{ ...revealProps(i).style, ... }}`.
 */
export function revealProps(index = 0): RevealProps {
  if (index <= 0) return { "data-reveal": "" };
  return { "data-reveal": "", style: { "--rvi": index } as CSSProperties };
}
