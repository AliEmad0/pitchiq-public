import { describe, expect, it } from "vitest";

import { rankBy, buildBoards } from "../../src/features/players/leaderboards-index";
import type { Player } from "../../src/data/schemas";

const mk = (id: number, over: Partial<Player["metrics"]>, name = `P${id}`): Player => ({
  id,
  name,
  teamId: 10,
  teamName: "Team",
  position: "Forward",
  photo: null,
  metrics: {
    appearances: 38,
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
    ...over,
  },
});

describe("rankBy", () => {
  const players = [
    mk(1, { goals: 10 }),
    mk(2, { goals: 20 }),
    mk(3, { goals: 0 }),
    mk(4, { goals: 20 }),
  ];

  it("ranks desc, drops null/zero, breaks value ties by id", () => {
    const rows = rankBy(players, "goals");
    expect(rows.map((r) => r.playerId)).toEqual([2, 4, 1]); // 3 dropped (0); 2 before 4 (tie → lower id)
    expect(rows[0].rank).toBe(1);
    expect(rows[0].value).toBe(20);
  });

  it("rounds decimal metrics for display", () => {
    const rows = rankBy([mk(1, { xg: 20.84 })], "xg", { decimals: 1 });
    expect(rows[0].value).toBe(20.8);
  });
});

describe("buildBoards", () => {
  it("includes core boards, omits boards with no data", () => {
    const boards = buildBoards([mk(1, { goals: 5, saves: null }), mk(2, { goals: 3 })]);
    const keys = boards.map((b) => b.cat.key);
    expect(keys).toContain("goals");
    expect(keys).toContain("appearances"); // universal
    expect(keys).not.toContain("saves"); // no data → omitted
  });

  it("includes a keeper board when the season has data", () => {
    const boards = buildBoards([mk(1, { saves: 100 }), mk(2, { saves: 80 })]);
    expect(boards.map((b) => b.cat.key)).toContain("saves");
  });

  it("restricts the Clean Sheets board to GK/DEF (M21)", () => {
    const gk = mk(1, { cleanSheets: 12 });
    gk.position = "Goalkeeper";
    const mid = mk(2, { cleanSheets: 14 }, "Mid");
    mid.position = "Midfielder";
    const boards = buildBoards([gk, mid]);
    const cs = boards.find((b) => b.cat.key === "cleanSheets");
    expect(cs).toBeDefined();
    expect(cs!.rows.map((r) => r.playerId)).toEqual([1]); // midfielder excluded
  });
});
