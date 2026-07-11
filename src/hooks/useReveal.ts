"use client";

import { useEffect } from "react";

import {
  REVEAL_DONE_ATTR,
  REVEAL_LIVE_ATTR,
  REVEAL_READY_ATTR,
  REVEAL_TARGET_ATTR,
} from "@/utils/reveal";

const UNREVEALED = `[${REVEAL_TARGET_ATTR}]:not([${REVEAL_DONE_ATTR}])`;

/** Scroll-lock class the TASK-1702 boot loader puts on <html> while it plays
 * (removed on its boot-exit animationend + a 4.2s fallback). */
const BOOT_LOCK_CLASS = "boot-lock";

/** Safety net: start revealing even if the boot lock somehow never clears. */
const BOOT_WAIT_MS = 5000;

/**
 * TASK-1704 — the reveal controller. One IntersectionObserver marks every
 * `[data-reveal]` element with `data-revealed` as it enters the viewport
 * (CSS in globals.css plays the soft-rise); a MutationObserver keeps newly
 * mounted content (client navigations, streamed Suspense output, lazy
 * chunks, tab switches, pagination) observed automatically.
 *
 * No-ops unless the pre-paint gate stamped `<html data-reveal-ready>` (JS on,
 * IO available, reduced motion off). On a first-visit boot (TASK-1702) it
 * defers starting until the `.boot-lock` clears so the page "assembles" as
 * the overlay fades instead of wasting the entrance behind it.
 */
export function useReveal(): void {
  useEffect(() => {
    const root = document.documentElement;
    if (!root.hasAttribute(REVEAL_READY_ATTR)) return;
    root.setAttribute(REVEAL_LIVE_ATTR, "");

    let io: IntersectionObserver | null = null;
    let mo: MutationObserver | null = null;
    let bootMo: MutationObserver | null = null;
    let bootTimer: ReturnType<typeof setTimeout> | null = null;
    let started = false;

    const start = () => {
      if (started) return;
      started = true;
      io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            entry.target.setAttribute(REVEAL_DONE_ATTR, "");
            io?.unobserve(entry.target);
          }
        },
        // Fire once the element's leading edge clears the bottom ~10% of the
        // viewport — late enough to read as a scroll reveal, early enough to
        // never hold content hostage.
        { rootMargin: "0px 0px -10% 0px" },
      );
      const observeWithin = (scope: Element | Document) => {
        for (const el of scope.querySelectorAll(UNREVEALED)) io?.observe(el);
      };
      observeWithin(document);
      mo = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          for (const node of mutation.addedNodes) {
            if (!(node instanceof Element)) continue;
            if (node.matches(UNREVEALED)) io?.observe(node);
            observeWithin(node);
          }
        }
      });
      mo.observe(document.body, { childList: true, subtree: true });
    };

    if (root.classList.contains(BOOT_LOCK_CLASS)) {
      bootMo = new MutationObserver(() => {
        if (root.classList.contains(BOOT_LOCK_CLASS)) return;
        bootMo?.disconnect();
        start();
      });
      bootMo.observe(root, { attributes: true, attributeFilter: ["class"] });
      bootTimer = setTimeout(() => {
        bootMo?.disconnect();
        start();
      }, BOOT_WAIT_MS);
    } else {
      start();
    }

    return () => {
      if (bootTimer !== null) clearTimeout(bootTimer);
      bootMo?.disconnect();
      io?.disconnect();
      mo?.disconnect();
      root.removeAttribute(REVEAL_LIVE_ATTR);
    };
  }, []);
}
