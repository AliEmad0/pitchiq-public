import { describe, it, expect } from "vitest";

import {
  recordFrom,
  seasonManagerRows,
  aggregateManagerCareer,
  deriveManagerTitles,
} from "../../src/features/managers/manager-stats";
import type { ManagersFile } from "../../src/data/schemas";

const E = (
  id: string,
  name: string,
  o: Partial<{
    matches: number;
    win: number;
    draw: number;
    loss: number;
    gf: number;
    ga: number;
  }> = {},
) => ({
  id,
  name,
  matches: o.matches ?? 0,
  win: o.win ?? 0,
  draw: o.draw ?? 0,
  loss: o.loss ?? 0,
  gf: o.gf ?? 0,
  ga: o.ga ?? 0,
});

const FIXTURE: ManagersFile = {
  "2008": {
    "33": [E("58", "Alex Ferguson", { matches: 38, win: 28, draw: 6, loss: 4, gf: 68, ga: 24 })],
  },
  "2009": {
    "33": [E("58", "Alex Ferguson", { matches: 38, win: 27, draw: 4, loss: 7, gf: 86, ga: 28 })],
    "34": [
      E("166", "Joe Kinnear", { matches: 20, win: 4, draw: 6, loss: 10, gf: 20, ga: 30 }),
      E("87", "Kevin Keegan", { matches: 18, win: 6, draw: 6, loss: 6, gf: 22, ga: 22 }),
    ],
  },
};

describe("recordFrom", () => {
  it("derives points, gd, ppg, winPct", () => {
    const r = recordFrom(E("x", "X", { matches: 10, win: 6, draw: 1, loss: 3, gf: 20, ga: 12 }));
    expect(r.points).toBe(19);
    expect(r.gd).toBe(8);
    expect(r.ppg).toBeCloseTo(1.9);
    expect(r.winPct).toBeCloseTo(60);
  });

  it("guards against zero matches", () => {
    const r = recordFrom(E("y", "Y"));
    expect(r.ppg).toBe(0);
    expect(r.winPct).toBe(0);
  });
});

describe("seasonManagerRows", () => {
  it("returns one row per (manager, club), sorted by points desc", () => {
    const rows = seasonManagerRows(FIXTURE, 2009);
    expect(rows.map((r) => r.managerId)).toEqual(["58", "87", "166"]); // 85, 24, 18 pts
    expect(rows[0].teamId).toBe(33);
    expect(rows[0].record.points).toBe(85);
  });

  it("returns [] for a season with no managers", () => {
    expect(seasonManagerRows(FIXTURE, 1999)).toEqual([]);
  });
});

describe("aggregateManagerCareer", () => {
  it("aggregates per club across seasons", () => {
    const c = aggregateManagerCareer(FIXTURE, "58");
    expect(c).not.toBeNull();
    expect(c!.name).toBe("Alex Ferguson");
    expect(c!.seasonsList).toEqual([2008, 2009]);
    expect(c!.byClub).toHaveLength(1);
    expect(c!.byClub[0]).toMatchObject({ teamId: 33, seasons: [2008, 2009] });
    expect(c!.byClub[0].record.played).toBe(76);
    expect(c!.totals.points).toBe(28 * 3 + 6 + (27 * 3 + 4));
    expect(c!.bySeason).toHaveLength(2);
    expect(c!.bySeason[0].season).toBe(2008);
  });

  it("returns null for an unknown id", () => {
    expect(aggregateManagerCareer(FIXTURE, "999")).toBeNull();
  });
});

describe("deriveManagerTitles", () => {
  it("credits the primary (most-matches) manager of a 1st-place team", () => {
    const titles = deriveManagerTitles(FIXTURE, "58", { 2008: 33, 2009: 33 });
    expect(titles).toEqual([
      { season: 2008, teamId: 33 },
      { season: 2009, teamId: 33 },
    ]);
  });

  it("does not credit a non-primary manager", () => {
    // team 34 in 2009: primary is 166 (20 matches), not 87 (18)
    expect(deriveManagerTitles(FIXTURE, "87", { 2009: 34 })).toEqual([]);
    expect(deriveManagerTitles(FIXTURE, "166", { 2009: 34 })).toEqual([
      { season: 2009, teamId: 34 },
    ]);
  });
});
