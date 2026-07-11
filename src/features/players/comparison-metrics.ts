import type { ComparisonMetrics } from "@/types/api";

// Display order + label + formatter for the 12 `ComparisonMetrics` fields
// on `/compare`. The page maps over this list once per `<StatRow>`, so
// changing the order here changes the on-page order. Tests in
// `tests/unit/compare-page-helpers.test.ts` pin:
//   - exactly 12 entries (one per ComparisonMetrics key)
//   - every key covered, no duplicates
//   - only `passAccuracy` carries a custom format ("%" suffix)
// Adding a new metric here without adding the field to `ComparisonMetrics`
// (or vice versa) fails the coverage test loudly.
// `subAppearances` (TASK-M39) is a breakdown of `appearances`, not its own
// comparison axis, so it's excluded here — keeping the list at the 12 core
// metrics and `metrics[key]` typed as `number | null` (not `| undefined`).
// `xg`/`xa` (TASK-M20) and `cleanSheets`/`saves` (TASK-M18) are likewise
// excluded: era-sparse (null pre-2017/2000) and rendered conditionally below the
// core list, not as one of the fixed 12 — keeping `metrics[key]` `number | null`.
// `label` is the English fallback (used by the OG-card renderers, which stay
// English/brand). `labelKey` is the message key in the `metrics` namespace — the
// on-page render sites (`/compare`, `<PlayerSeasonStats>`) resolve `t(labelKey)`
// so the label is localized once, shared across both surfaces (TASK-1603).
export const COMPARISON_METRICS: Array<{
  key: Exclude<keyof ComparisonMetrics, "subAppearances" | "xg" | "xa" | "cleanSheets" | "saves">;
  label: string;
  labelKey: string;
  format?: (n: number) => string;
}> = [
  // Volume metrics first — what a casual viewer scans for.
  { key: "appearances", label: "Appearances", labelKey: "appearances" },
  { key: "goals", label: "Goals", labelKey: "goals" },
  { key: "assists", label: "Assists", labelKey: "assists" },
  { key: "shotsOnTarget", label: "Shots on target", labelKey: "shotsOnTarget" },
  // Quality / progression next.
  {
    key: "passAccuracy",
    label: "Pass accuracy",
    labelKey: "passAccuracy",
    format: (n) => `${n.toFixed(1)}%`,
  },
  { key: "keyPasses", label: "Key passes", labelKey: "keyPasses" },
  { key: "dribblesCompleted", label: "Dribbles completed", labelKey: "dribblesCompleted" },
  // Defensive contributions.
  { key: "tackles", label: "Tackles", labelKey: "tackles" },
  { key: "interceptions", label: "Interceptions", labelKey: "interceptions" },
  { key: "duelsWon", label: "Duels won", labelKey: "duelsWon" },
  // Discipline last — typically the least-interesting axis.
  { key: "yellowCards", label: "Yellow cards", labelKey: "yellowCards" },
  { key: "redCards", label: "Red cards", labelKey: "redCards" },
];

// Normalize a Next 15 `searchParams.<key>` value into a positive integer
// or `null`. Handles the `string[]` case (the same key appearing twice
// in the URL) by taking the first occurrence, and rejects non-finite /
// non-integer values like `Infinity`, `NaN`, `1.5`. The page uses this
// for the `a` / `b` ids in `?a=<id>&b=<id>`.
export function parseId(raw: string | string[] | undefined): number | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === undefined || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n) || !Number.isInteger(n)) return null;
  return n;
}

export type SlotSeason = number | "all";

// Per-slot season (TASK-M24): the `?sa=`/`?sb=` value is a season int, the
// literal "all" (career aggregate), or absent/invalid → inherit the global
// season. Mirrors `parseId`'s `string[]` handling (first occurrence wins).
export function parseSlotSeason(
  raw: string | string[] | undefined,
  globalSeason: number,
): SlotSeason {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === "all") return "all";
  if (value === undefined || value === "") return globalSeason;
  const n = Number(value);
  if (!Number.isFinite(n) || !Number.isInteger(n)) return globalSeason;
  return n;
}
