import type { ComparisonMetrics } from "@/types/api";
import type { MetricMaxes } from "@/features/players/metric-maxes.api";

// The six radar axes — same shape as `MetricMaxes`, intentionally a
// subset of `ComparisonMetrics`. Volume + quality dimensions only;
// disciplinary cards live in `<StatRow>`s but not on the chart (giving
// "yellow cards" an axis would imply more = better at one corner,
// which the eye reads incorrectly on a radar).
//
// `as const` so TypeScript narrows the array to a tuple of literal keys
// — used as `keyof MetricMaxes` in the loop below.
export const RADAR_AXES = [
  "goals",
  "assists",
  "passAccuracy",
  "tackles",
  "dribblesCompleted",
  "shotsOnTarget",
] as const satisfies ReadonlyArray<keyof MetricMaxes>;

export type NormalizedRadar = {
  [K in (typeof RADAR_AXES)[number]]: number;
};

// Project a player's `ComparisonMetrics` to [0, 1] on each radar axis
// using `MetricMaxes` as the per-axis denominator. Pure function, owned
// by TASK-410 (Phase 4 normalisation helpers) — extracted from TASK-407
// so the math has a unit-test home that doesn't depend on the chart
// library being installed.
//
// Three null-safe rules:
//   - Null player value → 0 (api-football's "not measured" can't be
//     represented on a radar; rendering 0 avoids biasing the visual
//     comparison toward the other player).
//   - Zero max → 0 (no divide-by-zero). Realistic against a brand-new
//     season's cold cache, a corrupt cache entry, or a degenerate
//     league with no captured stats.
//   - Player value > max → clamp to 1.0. The page-1 sampling in
//     `getMetricMaxes` (TASK-412) only sees 20 of ~500 PL players; a
//     player on page 2+ can legitimately exceed the sampled max. Letting
//     the polygon expand past 1.0 would draw outside the chart bounds.
export function normalizeForRadar(metrics: ComparisonMetrics, maxes: MetricMaxes): NormalizedRadar {
  const result = {} as Record<(typeof RADAR_AXES)[number], number>;
  for (const axis of RADAR_AXES) {
    const value = metrics[axis];
    const max = maxes[axis];
    if (value === null || max === 0) {
      result[axis] = 0;
    } else {
      result[axis] = Math.min(1, value / max);
    }
  }
  return result;
}
