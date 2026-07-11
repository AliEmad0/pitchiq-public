import { describe, expect, it } from "vitest";

import {
  COMPARISON_METRICS,
  parseId,
  parseSlotSeason,
} from "@/features/players/comparison-metrics";
import type { ComparisonMetrics } from "@/types/api";

describe("parseId", () => {
  it("returns null for undefined", () => {
    expect(parseId(undefined)).toBeNull();
  });

  it("returns null for an empty string", () => {
    expect(parseId("")).toBeNull();
  });

  it("returns null for a non-numeric string", () => {
    expect(parseId("abc")).toBeNull();
  });

  it("returns null for Infinity / NaN / non-integer values", () => {
    expect(parseId("Infinity")).toBeNull();
    expect(parseId("NaN")).toBeNull();
    expect(parseId("1.5")).toBeNull();
  });

  it("returns the integer for a valid numeric string", () => {
    expect(parseId("1485")).toBe(1485);
    expect(parseId("0")).toBe(0);
  });

  it("picks the first element when given an array (Next searchParams quirk)", () => {
    // Next 15 `searchParams` typing allows `string[]` when the same key
    // appears multiple times in the URL. We take the first value.
    expect(parseId(["1485", "999"])).toBe(1485);
  });

  it("returns null when an array contains a non-numeric leading value", () => {
    expect(parseId(["abc", "1485"])).toBeNull();
  });
});

describe("parseSlotSeason", () => {
  it("returns the literal 'all'", () => {
    expect(parseSlotSeason("all", 2024)).toBe("all");
  });
  it("parses an integer season", () => {
    expect(parseSlotSeason("2003", 2024)).toBe(2003);
  });
  it("falls back to the global season when absent/empty/invalid", () => {
    expect(parseSlotSeason(undefined, 2024)).toBe(2024);
    expect(parseSlotSeason("", 2024)).toBe(2024);
    expect(parseSlotSeason("1.5", 2024)).toBe(2024);
    expect(parseSlotSeason("nope", 2024)).toBe(2024);
  });
  it("takes the first value of a repeated param", () => {
    expect(parseSlotSeason(["all", "2003"], 2024)).toBe("all");
  });
});

describe("COMPARISON_METRICS", () => {
  it("contains exactly 12 entries — one per ComparisonMetrics field", () => {
    // The 12-field shape is pinned by `ComparisonMetrics` itself. This
    // assertion guards against a metric being dropped from the page
    // without being removed from the type (or vice versa).
    expect(COMPARISON_METRICS).toHaveLength(12);
  });

  it("covers every ComparisonMetrics key without duplicates", () => {
    const keys = COMPARISON_METRICS.map((m) => m.key);
    const expected: Array<keyof ComparisonMetrics> = [
      "appearances",
      "goals",
      "assists",
      "passAccuracy",
      "keyPasses",
      "tackles",
      "interceptions",
      "duelsWon",
      "dribblesCompleted",
      "shotsOnTarget",
      "yellowCards",
      "redCards",
    ];
    // Both sides match as sets (order-insensitive — the page chooses
    // an opinionated display order but the type contract is unordered).
    expect(new Set(keys)).toEqual(new Set(expected));
    // No duplicates.
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("each entry has a non-empty human-readable label", () => {
    for (const m of COMPARISON_METRICS) {
      expect(typeof m.label).toBe("string");
      expect(m.label.length).toBeGreaterThan(0);
      // Sanity: no raw camelCase keys leaking into UI ("passAccuracy" →
      // "Pass accuracy", not the key).
      expect(m.label).not.toBe(m.key);
    }
  });

  it("only passAccuracy carries a custom format function — it's the only %-based metric", () => {
    // Wire convention: every other metric is a raw count (goals,
    // tackles, etc.). `passAccuracy` is the only one that needs the
    // "%" suffix in the UI. If a future metric joins (e.g., shot
    // conversion), this test fails loudly and forces an explicit
    // decision about whether it's percent-flavoured.
    const withFormat = COMPARISON_METRICS.filter((m) => m.format !== undefined);
    expect(withFormat).toHaveLength(1);
    expect(withFormat[0].key).toBe("passAccuracy");
    // The format produces the "%" suffix and a single decimal.
    expect(withFormat[0].format!(78.4)).toBe("78.4%");
    expect(withFormat[0].format!(0)).toBe("0.0%");
  });
});
