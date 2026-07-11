import { describe, expect, it } from "vitest";

import { mergeCaptains } from "@/data/captains-merge";

describe("mergeCaptains", () => {
  it("lets an override win over the derived captain", () => {
    const merged = mergeCaptains({ "2025": { "11": 1 } }, { "2025": { "11": 2 } });
    expect(merged["2025"]["11"]).toBe(2);
  });

  it("adds an override for a team-season the derived map lacks", () => {
    const merged = mergeCaptains({ "2025": { "11": 1 } }, { "2025": { "43": 9 } });
    expect(merged["2025"]["11"]).toBe(1);
    expect(merged["2025"]["43"]).toBe(9);
  });

  it("returns the derived map untouched when there are no overrides", () => {
    const base = { "2024": { "33": 1000208 } };
    expect(mergeCaptains(base, null)).toEqual(base);
    expect(mergeCaptains(base, {})).toEqual(base);
  });

  it("returns just the overrides when the derived map is null", () => {
    expect(mergeCaptains(null, { "2025": { "11": 2 } })).toEqual({ "2025": { "11": 2 } });
  });
});
