import { describe, expect, it } from "vitest";

import { ArNameMapSchema, SearchIndexSchema } from "@/data/schemas";

describe("ArNameMapSchema", () => {
  it("accepts a string→string record", () => {
    expect(ArNameMapSchema.parse({ "33": "مانشستر يونايتد" })).toEqual({
      "33": "مانشستر يونايتد",
    });
  });
  it("rejects non-string values", () => {
    expect(() => ArNameMapSchema.parse({ "33": 5 })).toThrow();
  });
});

describe("SearchIndexSchema nameAr", () => {
  it("accepts entries with optional nameAr", () => {
    const parsed = SearchIndexSchema.parse({
      players: [
        {
          id: 1,
          name: "X",
          teamId: 2,
          teamName: "T",
          photo: null,
          latestSeason: 2025,
          ga: 0,
          apps: 0,
          nameAr: "س",
        },
      ],
      teams: [{ id: 2, name: "T", latestSeason: 2025, nameAr: "ت" }],
      managers: [{ id: "m1", name: "M", photo: null, latestSeason: 2025, nameAr: "م" }],
    });
    expect(parsed.players[0].nameAr).toBe("س");
    expect(parsed.teams[0].nameAr).toBe("ت");
    expect(parsed.managers[0].nameAr).toBe("م");
  });
  it("still accepts entries without nameAr", () => {
    const parsed = SearchIndexSchema.parse({
      players: [],
      teams: [{ id: 2, name: "T", latestSeason: 2025 }],
      managers: [],
    });
    expect(parsed.teams[0].nameAr).toBeUndefined();
  });
});
