"use client";

import { useQueryStates, parseAsInteger, parseAsString } from "nuqs";

// URL-backed state for the Comparison engine.
// Slots: `?a=<id>&b=<id>`. Per-slot season (TASK-M24): `?sa=`/`?sb=`, each a
// season int as a string OR the literal "all" (career aggregate); absent →
// the page inherits the global `?season=`.
//
// `shallow: false` is the important bit: nuqs defaults to shallow updates
// (client-side URL only, no server re-render), but `/compare/page.tsx`
// resolves each slot server-side from these params. Without `shallow: false`,
// picking a player or changing a slot season would update the URL but leave
// the server-resolved data stale — the comparison would only refresh after a
// manual reload. `shallow: false` triggers a Next router refresh on every
// write so the server re-resolves and the comparison updates immediately.
// Surfaced by the TASK-411 E2E spec, which the unit tests couldn't catch
// (they pass `searchParams` directly to the awaited server component,
// bypassing the navigation flow).
export function useComparisonSelection() {
  const [{ a, b, sa, sb }, setSlots] = useQueryStates(
    {
      a: parseAsInteger,
      b: parseAsInteger,
      sa: parseAsString,
      sb: parseAsString,
    },
    { history: "push", clearOnDefault: true, shallow: false },
  );

  return {
    slotA: a,
    slotB: b,
    // string | null ("all", a numeric string, or null = inherit global season)
    seasonA: sa,
    seasonB: sb,
    // Picking/clearing a player resets that slot's season. An optional `season`
    // sets it explicitly — a fresh pick passes `"all"` so the slot defaults to
    // the career aggregate (owner request); omitted → null → inherit the global
    // season (the old season may not apply to the new player).
    setSlot: (slot: "A" | "B", playerId: number | null, season?: number | "all") => {
      const s = season != null ? String(season) : null;
      return setSlots(slot === "A" ? { a: playerId, sa: s } : { b: playerId, sb: s });
    },
    setSlotSeason: (slot: "A" | "B", value: number | "all" | null) => {
      const str = value === null ? null : String(value);
      return setSlots(slot === "A" ? { sa: str } : { sb: str });
    },
    clear: () => setSlots({ a: null, b: null, sa: null, sb: null }),
  };
}
