import type { ComparisonMetrics } from "@/types/api";
import type { MetricMaxes } from "@/features/players/metric-maxes.api";
import { RADAR_AXES } from "@/features/players/normalize-for-radar";

export type { MetricMaxes };

/**
 * Pairwise radar baseline (TASK-M24): each axis's "outer edge" is the larger
 * of the two compared players' own values, so the bigger side touches the rim.
 * The only normalization rule coherent across season-vs-season, season-vs-
 * career, and career-vs-career — the radar hides numeric ticks, so it is
 * already a relative head-to-head, not an absolute "vs the league" scale.
 * Null is treated as 0; `normalizeForRadar` already maps a 0 max to 0.
 */
export function pairwiseMaxes(a: ComparisonMetrics, b: ComparisonMetrics): MetricMaxes {
  const result = {} as MetricMaxes;
  for (const axis of RADAR_AXES) {
    result[axis] = Math.max(a[axis] ?? 0, b[axis] ?? 0);
  }
  return result;
}
