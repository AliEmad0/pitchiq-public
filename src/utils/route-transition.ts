// TASK-1703 — zoom-fade route transitions. Pure decision logic + the arrival
// registry behind <TransitionLink> (src/components/TransitionLink.tsx); the
// View Transition wrapping itself lives in the component.

/** The slice of a React MouseEvent the intercept decision needs (kept
 * structural so unit tests don't build real DOM events). */
export interface NavClickLike {
  button: number;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  defaultPrevented: boolean;
  currentTarget: {
    href?: unknown;
    target?: string;
    hasAttribute(name: string): boolean;
  };
}

/**
 * Decide whether a Link click should run inside a View Transition. Returns
 * the app-relative href to push, or `null` to leave the click to the normal
 * Next Link navigation — skipping opted-out (`defaultPrevented`), non-left /
 * modified clicks (new-tab gestures), targeted/download anchors, non-string
 * (SVG) or cross-origin hrefs, and clicks onto the SAME pathname+search
 * (the active nav item must not zoom the page onto itself).
 */
export function interceptNavClick(event: NavClickLike, currentHref: string): string | null {
  if (event.defaultPrevented) return null;
  if (event.button !== 0) return null;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return null;
  const anchor = event.currentTarget;
  if (anchor.target && anchor.target !== "_self") return null;
  if (anchor.hasAttribute("download")) return null;
  if (typeof anchor.href !== "string" || anchor.href === "") return null;
  let url: URL;
  let current: URL;
  try {
    url = new URL(anchor.href);
    current = new URL(currentHref);
  } catch {
    return null;
  }
  if (url.origin !== current.origin) return null;
  if (url.pathname === current.pathname && url.search === current.search) return null;
  return url.pathname + url.search + url.hash;
}

// Arrival registry: startViewTransition() waits for the update callback's
// promise before snapshotting the NEW state, but `router.push` returns void
// and the clicked link may unmount with the old page — so the pending
// resolver lives at module level and the persistent <RouteTransitionArrival>
// (mounted in the locale layout) settles it when `pathname + searchParams`
// actually change.
let pendingArrival: (() => void) | null = null;

/** Arm the arrival resolver for an in-flight navigation (replaces any prior). */
export function armArrival(resolve: () => void): void {
  pendingArrival = resolve;
}

/** Resolve the in-flight navigation's arrival, if any (idempotent). */
export function settleArrival(): void {
  if (pendingArrival) {
    const resolve = pendingArrival;
    pendingArrival = null;
    resolve();
  }
}
