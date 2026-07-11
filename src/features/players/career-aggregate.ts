import type { ComparisonMetrics } from "@/types/api";

// Every metric except `passAccuracy` is a counting stat that sums across
// seasons. `subAppearances` is optional on the schema but sums the same way.
const COUNTING_KEYS = [
  "appearances",
  "subAppearances",
  "goals",
  "assists",
  "keyPasses",
  "tackles",
  "interceptions",
  "duelsWon",
  "dribblesCompleted",
  "shotsOnTarget",
  "yellowCards",
  "redCards",
  // TASK-M20: career xG/xA = sum of the seasons that carry them (null-aware).
  "xg",
  "xa",
  // TASK-M18 (on /compare): career clean sheets + saves, same null-aware sum.
  "cleanSheets",
  "saves",
] as const satisfies ReadonlyArray<Exclude<keyof ComparisonMetrics, "passAccuracy">>;

/**
 * Career aggregate (TASK-M24, "All seasons"): sum counting stats null-aware
 * (an axis null in EVERY season stays null — honest for pre-2017 advanced
 * metrics); `passAccuracy` is averaged over seasons that have it, weighted by
 * that season's appearances (falls back to a simple average if all weights are
 * 0; null if no season has it).
 */
export function aggregateCareerMetrics(seasons: ComparisonMetrics[]): ComparisonMetrics {
  const out = {} as ComparisonMetrics;

  for (const key of COUNTING_KEYS) {
    let sum = 0;
    let any = false;
    for (const s of seasons) {
      const v = s[key];
      if (v !== null && v !== undefined) {
        sum += v;
        any = true;
      }
    }
    out[key] = any ? sum : null;
  }

  let weightedSum = 0;
  let weight = 0;
  let plainSum = 0;
  let plainCount = 0;
  for (const s of seasons) {
    if (s.passAccuracy === null || s.passAccuracy === undefined) continue;
    plainSum += s.passAccuracy;
    plainCount += 1;
    const w = s.appearances ?? 0;
    weightedSum += s.passAccuracy * w;
    weight += w;
  }
  out.passAccuracy =
    plainCount === 0 ? null : weight > 0 ? weightedSum / weight : plainSum / plainCount;

  return out;
}
