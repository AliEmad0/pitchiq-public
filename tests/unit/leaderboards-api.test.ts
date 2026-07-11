/**
 * Tests for `src/features/players/leaderboards.api.ts` — post TASK-505
 * snapshot migration.
 *
 * The four `getTop*` fetchers now read from committed JSON snapshots via
 * `loadLeaderboard` (src/data/loaders.ts) rather than hitting wire
 * over HTTP.  These tests verify:
 *   - correct synthesis of `PlayerLeaderboardEntry` from the flat snapshot
 *     `LeaderboardEntry` shape
 *   - correct slug mapping (cache-tag kind → loader kind)
 *   - correct statistics sub-key population (goals.total / goals.assists /
 *     cards.yellow / cards.red) so the existing `leaderboard-adapter.ts`
 *     adapters keep working without modification
 *   - graceful null on missing season
 *
 * Live data facts (data/leaderboards-2024.json, 2024-25 final):
 *   Top scorer:      Mohamed Salah, Liverpool, 29 goals
 *   Top assists:     Mohamed Salah, Liverpool, 18 assists
 *   Top yellow cards: Saša Lukić, Fulham, 12 yellows
 *   Top red cards:   Myles Lewis-Skelly, Arsenal, 2 reds
 */
import { describe, expect, it } from "vitest";

import {
  getTopAssists,
  getTopRedCards,
  getTopScorers,
  getTopYellowCards,
} from "@/features/players/leaderboards.api";

describe("getTopScorers — snapshot adapter", () => {
  it("returns a non-null array for season 2024", async () => {
    const result = await getTopScorers({ season: 2024 });

    expect(result).not.toBeNull();
    expect(result!.length).toBeGreaterThan(0);
    expect(result!.length).toBeLessThanOrEqual(10);
  });

  it("rank 1 is Mohamed Salah with 29 goals", async () => {
    const result = await getTopScorers({ season: 2024 });

    const first = result![0];
    expect(first.player.name).toBe("Mohamed Salah");
    expect(first.statistics).toHaveLength(1);
    expect(first.statistics[0].goals.total).toBe(29);
  });

  it("synthesizes team.name from snapshot entry", async () => {
    const result = await getTopScorers({ season: 2024 });

    expect(result![0].statistics[0].team.name).toBe("Liverpool");
  });

  it("does NOT populate assists or card sub-keys for scorers (null)", async () => {
    const result = await getTopScorers({ season: 2024 });

    const stats = result![0].statistics[0];
    expect(stats.goals.assists).toBeNull();
    expect(stats.cards.yellow).toBeNull();
    expect(stats.cards.red).toBeNull();
  });

  it("joins the player's FPL photo code by id (TASK-602/603)", async () => {
    const result = await getTopScorers({ season: 2024 });

    const player = result![0].player;
    expect(player.id).toBe(1001119); // Salah — stable cross-season id (TASK-704)
    // Salah's photo is joined from data/players-2024.json by id (not the old "").
    // It's a resolvable <PlayerImage> source — an FPL asset code OR an https URL
    // (his FPL code p118748 is one of the 174 broken codes nulled in TASK-M28e, so
    // it's now his committed portrait).
    expect(player.photo).toMatch(/^(\d+|https?:\/\/)/);
  });

  it("returns null for a season with no committed snapshot", async () => {
    const result = await getTopScorers({ season: 2099 });

    expect(result).toBeNull();
  });
});

describe("getTopAssists — snapshot adapter", () => {
  it("returns a non-null array for season 2024", async () => {
    const result = await getTopAssists({ season: 2024 });

    expect(result).not.toBeNull();
    expect(result!.length).toBeGreaterThan(0);
  });

  it("rank 1 is Mohamed Salah with 18 assists", async () => {
    const result = await getTopAssists({ season: 2024 });

    const first = result![0];
    expect(first.player.name).toBe("Mohamed Salah");
    expect(first.statistics[0].goals.assists).toBe(18);
  });

  it("does NOT populate goals.total or card sub-keys for assists (null)", async () => {
    const result = await getTopAssists({ season: 2024 });

    const stats = result![0].statistics[0];
    expect(stats.goals.total).toBeNull();
    expect(stats.cards.yellow).toBeNull();
    expect(stats.cards.red).toBeNull();
  });

  it("returns null for a season with no committed snapshot", async () => {
    const result = await getTopAssists({ season: 2099 });

    expect(result).toBeNull();
  });
});

describe("getTopYellowCards — snapshot adapter", () => {
  it("returns a non-null array for season 2024", async () => {
    const result = await getTopYellowCards({ season: 2024 });

    expect(result).not.toBeNull();
    expect(result!.length).toBeGreaterThan(0);
  });

  it("rank 1 is Flynn Downes with 12 yellow cards", async () => {
    const result = await getTopYellowCards({ season: 2024 });

    // Three players tie on 12; the leaderboard breaks value-ties by player id,
    // so rank 1 is the lowest stable id among them (TASK-704 reassigned ids).
    const first = result![0];
    expect(first.player.name).toBe("Flynn Downes");
    expect(first.statistics[0].cards.yellow).toBe(12);
  });

  it("synthesizes team.name from snapshot entry", async () => {
    const result = await getTopYellowCards({ season: 2024 });

    expect(result![0].statistics[0].team.name).toBe("Southampton");
  });

  it("does NOT populate goals or red-card sub-keys for yellow cards (null)", async () => {
    const result = await getTopYellowCards({ season: 2024 });

    const stats = result![0].statistics[0];
    expect(stats.goals.total).toBeNull();
    expect(stats.goals.assists).toBeNull();
    expect(stats.cards.red).toBeNull();
  });

  it("returns null for a season with no committed snapshot", async () => {
    const result = await getTopYellowCards({ season: 2099 });

    expect(result).toBeNull();
  });
});

describe("getTopRedCards — snapshot adapter", () => {
  it("returns a non-null array for season 2024", async () => {
    const result = await getTopRedCards({ season: 2024 });

    expect(result).not.toBeNull();
    expect(result!.length).toBeGreaterThan(0);
  });

  it("rank 1 is Bruno Fernandes with 2 red cards", async () => {
    const result = await getTopRedCards({ season: 2024 });

    // Several players tie on 2 red cards; value-ties break by player id, so
    // rank 1 is the lowest stable id among them (TASK-704 reassigned ids).
    const first = result![0];
    expect(first.player.name).toBe("Bruno Fernandes");
    expect(first.statistics[0].cards.red).toBe(2);
  });

  it("synthesizes team.name from snapshot entry", async () => {
    const result = await getTopRedCards({ season: 2024 });

    expect(result![0].statistics[0].team.name).toBe("Manchester Utd");
  });

  it("does NOT populate goals or yellow-card sub-keys for red cards (null)", async () => {
    const result = await getTopRedCards({ season: 2024 });

    const stats = result![0].statistics[0];
    expect(stats.goals.total).toBeNull();
    expect(stats.goals.assists).toBeNull();
    expect(stats.cards.yellow).toBeNull();
  });

  it("returns null for a season with no committed snapshot", async () => {
    const result = await getTopRedCards({ season: 2099 });

    expect(result).toBeNull();
  });
});

describe("all getTop* fetchers — shared contract", () => {
  it("each result entry has exactly 1 statistics record", async () => {
    const [scorers, assists, yellows, reds] = await Promise.all([
      getTopScorers({ season: 2024 }),
      getTopAssists({ season: 2024 }),
      getTopYellowCards({ season: 2024 }),
      getTopRedCards({ season: 2024 }),
    ]);

    for (const list of [scorers, assists, yellows, reds]) {
      for (const entry of list!) {
        expect(entry.statistics).toHaveLength(1);
      }
    }
  });

  it("each result entry has a team logo mapped to /logos/{teamId}.png", async () => {
    const result = await getTopScorers({ season: 2024 });

    for (const entry of result!) {
      const stats = entry.statistics[0];
      expect(stats.team.logo).toBe(`/logos/${stats.team.id}.png`);
    }
  });

  it("the module exports are all functions (server-only check)", () => {
    expect(typeof getTopScorers).toBe("function");
    expect(typeof getTopAssists).toBe("function");
    expect(typeof getTopYellowCards).toBe("function");
    expect(typeof getTopRedCards).toBe("function");
  });
});

// TASK-1606 follow-up: the leaderboard fetcher never threaded the resolver, so
// the /leaderboards page + dashboard scorer/card strips + the compare suggested
// cards all read Latin on /ar. The `locale` arg (passed by the route from
// `?locale=`) drives the REAL committed ar maps here — an integration check.
describe("getTop* — Arabic entity names on /ar (TASK-1606)", () => {
  it("localizes the player + club name when locale is ar", async () => {
    const result = await getTopScorers({ season: 2024, locale: "ar" });
    const first = result![0]; // Salah, Liverpool

    expect(first.player.name).not.toBe("Mohamed Salah");
    expect(first.player.name).toMatch(/[؀-ۿ]/); // contains Arabic
    expect(first.statistics[0].team.name).not.toBe("Liverpool");
    expect(first.statistics[0].team.name).toMatch(/[؀-ۿ]/);
  });

  it("keeps Latin names when locale is en (byte-unchanged /en)", async () => {
    const result = await getTopScorers({ season: 2024, locale: "en" });

    expect(result![0].player.name).toBe("Mohamed Salah");
    expect(result![0].statistics[0].team.name).toBe("Liverpool");
  });
});
