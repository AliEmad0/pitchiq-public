/**
 * League-wide maxima for the six radar axes. Field names mirror the matching
 * keys in `ComparisonMetrics` so the radar can normalise with
 * `player[key] / max[key]` and no name-mapping layer in between.
 *
 * TASK-M24 moved `/compare` to pairwise normalization (`pairwiseMaxes`), so the
 * old per-season `getMetricMaxes` loader was removed; this type remains the
 * shared shape the radar (`normalize-for-radar`, `ComparisonRadar`) consumes.
 */
export type MetricMaxes = {
  goals: number;
  assists: number;
  passAccuracy: number;
  tackles: number;
  dribblesCompleted: number;
  shotsOnTarget: number;
};
