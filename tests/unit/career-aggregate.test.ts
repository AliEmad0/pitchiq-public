import { describe, expect, it } from "vitest";

import { aggregateCareerMetrics } from "@/features/players/career-aggregate";
import type { ComparisonMetrics } from "@/types/api";

function m(overrides: Partial<ComparisonMetrics> = {}): ComparisonMetrics {
  return {
    appearances: 0,
    goals: 0,
    assists: 0,
    passAccuracy: null,
    keyPasses: null,
    tackles: null,
    interceptions: null,
    duelsWon: null,
    dribblesCompleted: null,
    shotsOnTarget: null,
    yellowCards: 0,
    redCards: 0,
    ...overrides,
  };
}

describe("aggregateCareerMetrics", () => {
  it("sums counting stats null-aware", () => {
    const out = aggregateCareerMetrics([
      m({ appearances: 30, goals: 20, assists: 5 }),
      m({ appearances: 25, goals: 14, assists: 7 }),
    ]);
    expect(out.appearances).toBe(55);
    expect(out.goals).toBe(34);
    expect(out.assists).toBe(12);
  });

  it("sums clean sheets + saves across seasons null-aware (TASK-M18 on /compare)", () => {
    const out = aggregateCareerMetrics([
      m({ cleanSheets: 14, saves: 120 }),
      m({ cleanSheets: 11, saves: 95 }),
    ]);
    expect(out.cleanSheets).toBe(25);
    expect(out.saves).toBe(215);

    const old = aggregateCareerMetrics([m({ cleanSheets: null, saves: null })]);
    expect(old.cleanSheets).toBeNull();
    expect(old.saves).toBeNull();
  });

  it("keeps an axis null only when every season is null", () => {
    const out = aggregateCareerMetrics([
      m({ tackles: null }),
      m({ tackles: 12 }),
      m({ tackles: null }),
    ]);
    expect(out.tackles).toBe(12); // one non-null contribution → number

    const allNull = aggregateCareerMetrics([m({ tackles: null }), m({ tackles: null })]);
    expect(allNull.tackles).toBeNull();
  });

  it("computes appearances-weighted Pass % over seasons that have it", () => {
    // (90*10 + 80*30) / (10+30) = (900+2400)/40 = 82.5
    const out = aggregateCareerMetrics([
      m({ appearances: 10, passAccuracy: 90 }),
      m({ appearances: 30, passAccuracy: 80 }),
      m({ appearances: 20, passAccuracy: null }), // skipped
    ]);
    expect(out.passAccuracy).toBeCloseTo(82.5, 5);
  });

  it("falls back to a simple Pass % average when all weights are 0", () => {
    const out = aggregateCareerMetrics([
      m({ appearances: 0, passAccuracy: 70 }),
      m({ appearances: 0, passAccuracy: 90 }),
    ]);
    expect(out.passAccuracy).toBe(80);
  });

  it("returns null Pass % when no season has it", () => {
    const out = aggregateCareerMetrics([m({ passAccuracy: null }), m({ passAccuracy: null })]);
    expect(out.passAccuracy).toBeNull();
  });
});
