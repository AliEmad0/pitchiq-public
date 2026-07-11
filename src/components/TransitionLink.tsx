"use client";

import { useRouter } from "next/navigation";
import type { ComponentProps, MouseEvent } from "react";

import { Link as BaseLink } from "@/i18n/navigation-base";
import { prefersReducedMotion } from "@/utils/motion";
import { armArrival, interceptNavClick } from "@/utils/route-transition";

// View Transitions freeze rendering until the update callback settles — a
// slow dynamic route must not hold frames, so arrival is capped and the
// transition proceeds (content then swaps in unanimated). Matches the spec.
const ARRIVAL_TIMEOUT_MS = 1200;

type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void | Promise<unknown>) => {
    finished: Promise<void>;
  };
};

/**
 * TASK-1703 — the app-wide `Link` (re-exported as `@/i18n/navigation`'s
 * `Link`, the single seam every internal link goes through since the batch-12
 * sweep). Wraps the raw locale-aware Link so an internal navigation runs
 * inside a native View Transition — the owner-picked ZOOM FADE, scoped via
 * `<html data-vt="nav">` so the TASK-910 compare slot-fill morph never zooms
 * the page (see globals.css).
 *
 * The caller's `onClick` runs FIRST (drawer close, menu dismiss — sibling
 * bubble handlers keep firing; we never stopPropagation) and can opt out with
 * `preventDefault()`. When the API is missing (Firefox) or the user prefers
 * reduced motion, the click proceeds as a normal Link nav — instant fallback.
 * The pushed href is the DOM-resolved `currentTarget.href` (locale prefix
 * already baked in), so the plain `next/navigation` router is correct.
 */
export function Link({ onClick, ...rest }: ComponentProps<typeof BaseLink>) {
  const router = useRouter();

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    const doc = document as ViewTransitionDocument;
    if (!doc.startViewTransition || prefersReducedMotion()) return;
    const href = interceptNavClick(event, window.location.href);
    if (href === null) return;
    event.preventDefault();
    document.documentElement.dataset.vt = "nav";
    const transition = doc.startViewTransition(() => {
      router.push(href);
      return new Promise<void>((resolve) => {
        armArrival(resolve);
        setTimeout(resolve, ARRIVAL_TIMEOUT_MS);
      });
    });
    void transition.finished.finally(() => {
      delete document.documentElement.dataset.vt;
    });
  }

  return <BaseLink {...rest} onClick={handleClick} />;
}
