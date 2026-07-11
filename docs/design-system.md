# PitchIQ Design System (TASK-1501)

The shared foundation the Phase 15 redesign was built on. It was authored
retroactively once the phase shipped — the `show_widget` design ritual (below)
served as the working foundation while the pages were built; this file codifies
the language that emerged so Phase 16 (i18n/RTL), Phase 17 (animations), and any
future page stay consistent with it.

Status of the phase it gates: **Phase 15 complete** (TASK-1502…1516 all shipped).

---

## 1. Component + token inventory

### Shared UI primitives — `src/components/ui/`

Shadcn-generated, installed on demand. A restyle here **ripples to every page**, so
changes are token-level, not per-instance:

`avatar` · `badge` · `button` · `card` · `command` · `dialog` · `dropdown-menu` ·
`input` · `popover` · `select` · `separator` · `sheet` · `skeleton` · `table` ·
`tabs` · `tooltip`.

### Shared cross-feature components — `src/components/`

- `brand/PitchIQLogo.tsx` — the single source-of-truth mark + wordmark.
- `layout/*` — `Header`, `PrimaryNav`/`NavLink`, `MobileNav`, `Footer`, the season /
  theme / search control cluster. Frames every page (TASK-1502).
- `BoundaryPanel.tsx` — the "VAR review panel" card driving error / not-found /
  per-route 404s (TASK-1503).
- `DataUnavailable.tsx` — generic empty-state card (`role="status"`).
- `ImageZoom.tsx` — click-to-enlarge lightbox (player photo, team crest).
- `skeletons/*`, `theme/*`, `providers/*`.

### Page-local feature components — `src/features/*/components/`

Owned by one feature; a redesign there is contained. Examples: `StatLeaderboard`
(shared across dashboard + `/leaderboards` — has a `variant="badge"` opt-in so the
dashboard bento keeps the default look), `PlayerHero`, `TeamHero`, `ManagerHero`,
`PitchLineup`, `EventTimeline`, `FixtureBrowser`, `SeasonSlider`, `UkMap`. When a
component is shared across pages, note it and change it via a prop/variant, never a
breaking restyle.

---

## 2. Design language (tokens)

All theming flows through **semantic CSS variables** in `src/app/globals.css`, mapped
to Tailwind v4 utilities via `@theme inline`. There is **no `tailwind.config.ts`** —
adding one breaks the setup. Never hardcode a hex in a component; read a token.

### Colour — surfaces + status

`--background` `--foreground` `--card(-foreground)` `--popover(-foreground)`
`--primary(-foreground)` `--secondary(-foreground)` `--muted(-foreground)`
`--accent(-foreground)` `--destructive(-foreground)` `--success(-foreground)`
`--border` `--input` `--ring` `--chart-1` `--chart-2`.

- Baseline palette (modern era): PL-purple — magenta `--primary` `#c91dbb` (dark) /
  `#a3179a` (light), purple-undertone darks `#0c0a14` / `#1a1726` / `#252134`.
- `--chart-1/2` are **theme-invariant** (same in `:root` + `.dark`) because
  `<ComparisonRadar>` reads them at runtime and they must not go stale on toggle.
- **Deliberately era- and theme-invariant** (encode meaning, not brand): standings
  qualification colours (`QUALIFICATION_STYLES`), medal gold/silver/bronze, trophy
  gold, and the lineup pitch green (`bg-[#1a7a40]` + white lines) — see §5.

### Radius

`--radius: 0.625rem` with derived `--radius-sm/md/lg/xl`. Use the utilities
(`rounded-md`, `rounded-xl`), not raw pixel values.

### Typography

`--font-sans` (Geist) + `--font-mono` (Geist Mono) baseline; per-era display fonts
(`--font-era-display`) swap under `[data-era]` (Oswald retro / Rajdhani + Titillium
golden). Headings pick up the era display font automatically via
`[data-era] :is(h1,h2,h3,h4)`. Arabic webfont composition (Phase 16) layers on top of
this — keep new type scale token-driven so the Arabic font can slot in per-era.

### Spacing / density

Tailwind's default spacing scale, applied through `container-page` for page gutters
and `space-y-*` / `gap-*` for rhythm. **Full-bleed pattern** (used by the map
letterbox): a full-width `<main>` (no `container-page`) with an inner `container-page`
re-containing the content — see `src/app/map/page.tsx`.

### The two independent axes on `<html>`

- **Theme** (`.dark` class) — owned by next-themes + the toggle.
- **Era** (`data-era` attribute) — owned by the season → `eraForSeason` mapping, set
  pre-paint by the no-flash script in `layout.tsx` and kept in sync by
  `<EraController>`.

**Gotcha (durable):** Tailwind v4's `dark:` variant follows the OS
`prefers-color-scheme` **unless** `@custom-variant dark (&:where(.dark, .dark *))` is
declared in `globals.css` (it is) — so `dark:` tracks the in-app toggle, not the OS.

---

## 3. Responsive + accessibility checklist

Every page ticket verifies against this net (referenced by TASK-1504…1516):

**Breakpoints — verify at 3 widths:** `1440` (desktop) · `768` (tablet) · `375`
(mobile). No horizontal page scroll at 375 (use `min-w-0` on grid children so an inner
`overflow-x-auto` table contains itself).

**Era × mode matrix — verify 6 combinations:** retro90s / goldenMillennium / modern
× light / dark. Meaning-bearing colours (qualification, medals, pitch) must stay
constant across all six.

**Accessibility:**

- WCAG AA contrast for every fg/bg + status-chip pair, in all 6 combinations.
- Keyboard operability (map regions activate on Enter; dialogs trap focus).
- `role`/`aria-label` on status cards, landmarks, and icon-only controls.
- All motion `prefers-reduced-motion`-gated — see [docs/motion.md](motion.md)
  for the motion tokens, reduced-motion policy, and which-tool-when guide
  (TASK-1701).
- **RTL-ready (Phase 16):** author with CSS **logical properties** (`ms/me`, `ps/pe`,
  `start/end`, `text-align: start`) so Arabic mirrors for free — no physical `ml-`/
  `pr-`/`left-`/`text-left` on shared or layout components.

**Regression lock:** computed-style assertions live in
`tests/e2e/_helpers/visual-assertions.ts` + `tests/e2e/redesign-visual.spec.ts` +
`tests/e2e/era-themes.spec.ts` (Playwright renders the **light** theme; Tailwind v4
emits `oklch()` which the helper rasterises to sRGB via a 1×1 canvas).

---

## 4. The redesign ritual — "10 (or 30) designs → pick one"

The repeatable per-page/-section workflow, proven across TASK-M53 and every Phase 15
ticket:

1. **Present concepts as a full-page interactive `show_widget` browser** — not static
   thumbnails. One HTML+JS widget with a `designs[]` array of render fns + Prev/Next +
   a `<select>` + light/dark + era toggles, rendering the **whole page with real
   data**. The owner cannot judge a page from a thumbnail; they need to click through
   it in context. (Two parallel agents can author two 30-concept browsers at once.)
2. **Owner picks one** (and often refines sub-sections via a second, narrower browser).
3. **Implement** the chosen concept, preserving the Time-Machine era system + light/
   dark and authoring logical-property-first for RTL.
4. **Verify** across the era × mode × 3-width matrix in §3, then extend the
   visual-regression net.

---

## 5. Invariants that outrank the design language

These encode meaning or real-world fact and must **not** be re-skinned by a page
redesign or the era system:

- Standings qualification row colours (`QUALIFICATION_STYLES`).
- Leaderboard medal discs (gold / silver / bronze) + trophy honours gold.
- The lineup pitch is **always green grass** (`bg-[#1a7a40]`, white lines/names/
  stripes) — a theme token would go olive-grey on the retro cream page.
- Nationality flags render **neutrally** — no nationality-targeting relabels.
