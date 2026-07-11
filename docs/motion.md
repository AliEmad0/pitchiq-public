# Motion (Phase 17 foundation — TASK-1701)

The canonical reference for animation in PitchIQ. Read this before adding any
motion.

**Audited (TASK-1706):** every animation honours reduced motion per the policy
below, every `@keyframes` animates compositor/paint-only properties (enforced
by `tests/unit/motion-audit.test.ts` — a `width`/`top` keyframe fails CI), and
Motion ships zero client bytes. New animations must keep all three true. Note
the Shadcn overlay entrances + `animate-pulse` are reduce-gated centrally in
globals.css (the TASK-1706 block) — new Radix surfaces with a
`data-slot="…-content"` get the gate for free only if added to that list.

## Entrance / scroll reveal (TASK-1704 — "Soft rise")

Page content opts into a staggered fade + 14px-lift reveal with
`{...revealProps(i)}` (`src/utils/reveal.ts`); the motion is pure CSS in
globals.css on the tokens below, driven by ONE layout island
(`<RevealController>` → `src/hooks/useReveal.ts`: IntersectionObserver +
MutationObserver, so streamed/lazy/client-nav content reveals too).

Rules:

- The hidden state only exists under `<html data-reveal-ready>` — stamped
  PRE-PAINT by an inline gate (JS on + IO available + reduced motion off), so
  no-JS/reduced-motion visits never see hidden content, and a CSS failsafe
  auto-plays the reveal if hydration dies after the gate stamped.
- `data-revealed` is set via the DOM by the controller — NEVER render it from
  React (a client re-render would reset it and re-hide the element).
- Don't put `data-reveal` on: anything viewport-sticky or its ancestors
  (`/map` letterbox bars), real `<table>` rows (sticky columns + `tr`
  transforms), skeletons/loading states, or elements carrying a
  `view-transition-name` (the compare slot morph).
- Wrap the CONTENT, not the `<Suspense>` — a fallback must stay visible.
- Elements with an existing inline `style` merge manually:
  `style={{ ...revealProps(i).style, ... }}`.

## Tokens

CSS owns the values (`src/app/globals.css`); `src/utils/motion.ts` mirrors
them for JS-driven motion; `tests/unit/motion-tokens.test.ts` enforces parity.
**Era-invariant** — motion timing does not change with the Time-Machine era.

| Token                    | Value                               | Use for                          |
| ------------------------ | ----------------------------------- | -------------------------------- |
| `--motion-duration-fast` | 150ms                               | hover/press, color/opacity       |
| `--motion-duration-base` | 300ms                               | entrances, slides                |
| `--motion-duration-slow` | 600ms                               | emphasis pulses, loader beats    |
| `--ease-out-soft`        | `cubic-bezier(0.25, 1, 0.5, 1)`     | decelerating entrances (default) |
| `--ease-in-out-soft`     | `cubic-bezier(0.45, 0, 0.55, 1)`    | symmetric moves                  |
| `--ease-pop`             | `cubic-bezier(0.34, 1.56, 0.64, 1)` | playful overshoot (slot-fill)    |

Usage: plain CSS `animation: name var(--motion-duration-base) var(--ease-out-soft);`
Tailwind: `ease-out-soft` / `ease-in-out-soft` / `ease-pop` utilities generate
from the `@theme` block; durations via `duration-(--motion-duration-fast)`.
JS/Motion: `MOTION_DURATION` (ms) + `MOTION_EASE` (bezier tuples) + `cssEase()`.

## Micro-interactions (TASK-1705 — "Neon glow")

The interaction language: hovering an interactive surface lights an
**era-accent halo** + tints its border toward the accent; presses compress to
98%; dropdowns pop in on the fast token. Utilities in globals.css:

- `ix-glow` — hover halo (override the colour with `--ix-glow`, e.g. the
  club-coloured teams grid). State rules are specificity-bumped past the
  golden era's gel-card bevel — keep them `:root .ix-glow.ix-glow:hover`.
- `ix-press` — press compress (transform → gated under reduced motion).
- `ix-row` — table-row hover wash painted on the CELLS so it covers opaque
  sticky columns.
- `ix-tab` — tab-trigger hover + standing active glow.
- `ix-pop` — dropdown/panel entrance (gated under reduced motion).
- `ix-halo` — standing neon frame (the ⌘K palette).

Apply the glow only to elements that are themselves interactive; ghost/link
buttons stay quiet chrome.

## Which tool when

| Tool                                     | Use for                                                                            | Cost                            |
| ---------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------- |
| **CSS/Tailwind keyframes + transitions** | DEFAULT. Entrances, pulses, hover/press, skeletons                                 | zero                            |
| **View Transitions API**                 | URL-state morphs + route transitions (`runViewTransition`, `view-transition-name`) | zero (native, feature-detected) |
| **Motion** (`motion` npm)                | Orchestrated sequences, gestures, spring physics — the game loader (TASK-1702)     | lazy chunk only — see below     |

**Motion is lazy-only.** Never import `"motion"` / `"motion/react"` statically
from production code. Imperative use: `await loadMotion()`
(`src/utils/motion.ts`). React components: wrap with `next/dynamic` +
`ssr: false` (the `ComparisonRadarLazy` pattern) and import `"motion/react"`
inside the lazy chunk. First Load JS of pages that don't animate must not grow.

## Reduced-motion policy

**Per-feature gating, not a blanket kill.** A global `* { animation: none }`
can't distinguish acceptable motion from vestibular triggers and risks
breaking JS that awaits `animationend`/`transitionend`.

Rule of thumb:

- Transform/scale/large-movement animation **MUST** gate.
- Opacity-only fades ≤ `--motion-duration-base` **MAY** persist.
- Autoplaying motion (sliders, loaders) **MUST** stop or offer a static frame.

How to gate:

- CSS: wrap in `@media (prefers-reduced-motion: reduce) { … animation: none; }`
  (see the guards in `globals.css`).
- Reactive components: `useReducedMotion()` (`src/hooks/useReducedMotion.ts`) —
  `false` on server + first client render (hydration-safe), live thereafter.
- Imperative one-shots (View Transition gate, autoplay decisions):
  `prefersReducedMotion()` (`src/utils/motion.ts`).
- View Transitions: already killed globally under reduce in `globals.css`
  (`::view-transition-*`) + the JS gate in `runViewTransition`.
