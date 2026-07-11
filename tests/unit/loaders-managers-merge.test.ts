import { describe, it, expect } from "vitest";

import { mergeManagersFiles } from "../../src/data/loaders";

const entry = (id: string, name: string) => ({
  id,
  name,
  matches: 38,
  win: 20,
  draw: 10,
  loss: 8,
  gf: 60,
  ga: 40,
});

describe("mergeManagersFiles", () => {
  it("combines disjoint season keys from modern + legacy", () => {
    const modern = { "2008": { "33": [entry("58", "Alex Ferguson")] } };
    const legacy = { "1993": { "33": [entry("58", "Alex Ferguson")] } };
    const out = mergeManagersFiles(modern, legacy);
    expect(Object.keys(out!).sort()).toEqual(["1993", "2008"]);
  });

  it("returns modern alone when legacy is null", () => {
    const modern = { "2008": { "33": [entry("58", "Alex Ferguson")] } };
    expect(mergeManagersFiles(modern, null)).toEqual(modern);
  });

  it("returns legacy alone when modern is null", () => {
    const legacy = { "1993": { "33": [entry("58", "Alex Ferguson")] } };
    expect(mergeManagersFiles(null, legacy)).toEqual(legacy);
  });

  it("returns null when both are null", () => {
    expect(mergeManagersFiles(null, null)).toBeNull();
  });

  it("throws if a season key overlaps (writers must stay disjoint)", () => {
    expect(() => mergeManagersFiles({ "2000": {} }, { "2000": {} })).toThrow(/overlap/i);
  });
});
