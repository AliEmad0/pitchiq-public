import { describe, expect, it } from "vitest";

import { normalizeForRadar, RADAR_AXES } from "@/features/players/normalize-for-radar";
import type { ComparisonMetrics } from "@/types/api";
import type { MetricMaxes } from "@/features/players/metric-maxes.api";

function metrics(overrides: Partial<ComparisonMetrics> = {}): ComparisonMetrics {
  return {
    appearances: 30,
    goals: 12,
    assists: 8,
    passAccuracy: 80,
    keyPasses: 40,
    tackles: 25,
    interceptions: 15,
    duelsWon: 100,
    dribblesCompleted: 30,
    shotsOnTarget: 20,
    yellowCards: 3,
    redCards: 1,
    ...overrides,
  };
}

function maxes(overrides: Partial<MetricMaxes> = {}): MetricMaxes {
  return {
    goals: 24,
    assists: 16,
    passAccuracy: 95,
    tackles: 80,
    dribblesCompleted: 90,
    shotsOnTarget: 60,
    ...overrides,
  };
}

describe("normalizeForRadar", () => {
  it("returns exactly the 6 radar axes and nothing else", () => {
    const normalized = normalizeForRadar(metrics(), maxes());
    expect(Object.keys(normalized).sort()).toEqual(
      ["assists", "dribblesCompleted", "goals", "passAccuracy", "shotsOnTarget", "tackles"].sort(),
    );
  });

  it("maps a player at exactly the league max to 1.0 on every axis", () => {
    const m = maxes();
    const player = metrics({
      goals: m.goals,
      assists: m.assists,
      passAccuracy: m.passAccuracy,
      tackles: m.tackles,
      dribblesCompleted: m.dribblesCompleted,
      shotsOnTarget: m.shotsOnTarget,
    });
    const normalized = normalizeForRadar(player, m);
    for (const axis of RADAR_AXES) {
      expect(normalized[axis]).toBe(1);
    }
  });

  it("maps a player at half the league max to 0.5", () => {
    const m = maxes({
      goals: 20,
      assists: 10,
      passAccuracy: 90,
      tackles: 50,
      dribblesCompleted: 100,
      shotsOnTarget: 40,
    });
    const player = metrics({
      goals: 10,
      assists: 5,
      passAccuracy: 45,
      tackles: 25,
      dribblesCompleted: 50,
      shotsOnTarget: 20,
    });
    const normalized = normalizeForRadar(player, m);
    expect(normalized.goals).toBe(0.5);
    expect(normalized.assists).toBe(0.5);
    expect(normalized.passAccuracy).toBe(0.5);
    expect(normalized.tackles).toBe(0.5);
    expect(normalized.dribblesCompleted).toBe(0.5);
    expect(normalized.shotsOnTarget).toBe(0.5);
  });

  it("maps a zero player value to 0 (no spike on the axis)", () => {
    const normalized = normalizeForRadar(metrics({ goals: 0, assists: 0 }), maxes());
    expect(normalized.goals).toBe(0);
    expect(normalized.assists).toBe(0);
  });

  it("clamps a player value that exceeds the league max to 1.0", () => {
    // The page-1 max heuristic in `getMetricMaxes` is a documented
    // compromise (TASK-412): it samples 20 players, not all 500. A
    // player on page 2+ could legitimately exceed the sampled max.
    // Clamping is the right move — a radar polygon expanding past 1.0
    // would draw outside the chart bounds and look broken.
    const normalized = normalizeForRadar(metrics({ goals: 30 }), maxes({ goals: 20 }));
    expect(normalized.goals).toBe(1);
  });

  it("treats a null player value as 0 (not measured = no axis spike)", () => {
    // `ComparisonMetrics` preserves the wire null vs 0
    // distinction. Radar charts can't represent "not measured" — best
    // we can do is render 0 and not bias the comparison.
    const normalized = normalizeForRadar(
      metrics({ passAccuracy: null, dribblesCompleted: null }),
      maxes(),
    );
    expect(normalized.passAccuracy).toBe(0);
    expect(normalized.dribblesCompleted).toBe(0);
  });

  it("returns 0 when a max is 0 to avoid division-by-zero (degenerate league)", () => {
    // Unrealistic against live data, but the helper has to handle it
    // gracefully — a brand-new season with zero captured stats, a
    // corrupt cache entry, etc.
    const normalized = normalizeForRadar(metrics({ goals: 5 }), maxes({ goals: 0 }));
    expect(normalized.goals).toBe(0);
  });

  it("computes each axis independently — one null doesn't zero the others", () => {
    const normalized = normalizeForRadar(
      metrics({
        goals: 12,
        assists: null,
        passAccuracy: 80,
        tackles: null,
        dribblesCompleted: 30,
        shotsOnTarget: null,
      }),
      maxes({
        goals: 24,
        assists: 16,
        passAccuracy: 100,
        tackles: 80,
        dribblesCompleted: 60,
        shotsOnTarget: 40,
      }),
    );
    expect(normalized.goals).toBe(0.5);
    expect(normalized.assists).toBe(0);
    expect(normalized.passAccuracy).toBe(0.8);
    expect(normalized.tackles).toBe(0);
    expect(normalized.dribblesCompleted).toBe(0.5);
    expect(normalized.shotsOnTarget).toBe(0);
  });
});

describe("RADAR_AXES", () => {
  it("lists exactly the six fields the radar will render", () => {
    expect(RADAR_AXES).toEqual([
      "goals",
      "assists",
      "passAccuracy",
      "tackles",
      "dribblesCompleted",
      "shotsOnTarget",
    ]);
  });

  it("matches MetricMaxes's keys exactly — no drift between data + chart", () => {
    // A compile-time check the RADAR_AXES is keyof MetricMaxes is in
    // the source via `as const`, but pinning at runtime catches accidental
    // re-orderings or stale copies that lose type-narrowing.
    const exampleMaxes: MetricMaxes = {
      goals: 1,
      assists: 1,
      passAccuracy: 1,
      tackles: 1,
      dribblesCompleted: 1,
      shotsOnTarget: 1,
    };
    expect(new Set(RADAR_AXES)).toEqual(new Set(Object.keys(exampleMaxes)));
  });
});
