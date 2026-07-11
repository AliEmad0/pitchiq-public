import { describe, expect, it } from "vitest";

import { pairwiseMaxes } from "@/features/players/pairwise-maxes";
import type { ComparisonMetrics } from "@/types/api";

function m(overrides: Partial<ComparisonMetrics> = {}): ComparisonMetrics {
  return {
    appearances: 0,
    goals: 0,
    assists: 0,
    passAccuracy: 0,
    keyPasses: 0,
    tackles: 0,
    interceptions: 0,
    duelsWon: 0,
    dribblesCompleted: 0,
    shotsOnTarget: 0,
    yellowCards: 0,
    redCards: 0,
    ...overrides,
  };
}

describe("pairwiseMaxes", () => {
  it("takes the per-axis max of the two players over the six radar axes", () => {
    const a = m({ goals: 24, assists: 5, tackles: 40, passAccuracy: 70 });
    const b = m({ goals: 27, assists: 12, tackles: 10, passAccuracy: 88 });
    expect(pairwiseMaxes(a, b)).toEqual({
      goals: 27,
      assists: 12,
      passAccuracy: 88,
      tackles: 40,
      dribblesCompleted: 0,
      shotsOnTarget: 0,
    });
  });

  it("treats null as 0", () => {
    const a = m({ goals: null, shotsOnTarget: null });
    const b = m({ goals: 9, shotsOnTarget: null });
    const out = pairwiseMaxes(a, b);
    expect(out.goals).toBe(9);
    expect(out.shotsOnTarget).toBe(0);
  });
});
