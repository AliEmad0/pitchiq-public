import { describe, expect, it } from "vitest";

import { aggregateTeamSeasonStats } from "@/features/teams/team-season-stats";
import type { Fixture } from "@/data/schemas";

type MatchStats = NonNullable<Fixture["teamStats"]>["home"];

function ms(overrides: Partial<MatchStats> = {}): MatchStats {
  return {
    shots: 0,
    shotsOnTarget: 0,
    corners: 0,
    fouls: 0,
    yellowCards: 0,
    redCards: 0,
    ...overrides,
  };
}

/** Minimal Fixture factory — mirrors the one in form.test.ts. */
function fx(partial: Partial<Fixture> & Pick<Fixture, "id" | "date">): Fixture {
  return {
    id: partial.id,
    date: partial.date,
    homeTeamId: partial.homeTeamId ?? 1,
    awayTeamId: partial.awayTeamId ?? 2,
    homeTeamName: partial.homeTeamName ?? "Home",
    awayTeamName: partial.awayTeamName ?? "Away",
    homeScore: partial.homeScore ?? null,
    awayScore: partial.awayScore ?? null,
    venue: partial.venue ?? "",
    teamStats: partial.teamStats ?? null,
    halfTime: partial.halfTime ?? null,
    referee: partial.referee ?? null,
  };
}

describe("aggregateTeamSeasonStats", () => {
  const TEAM = 10;

  it("counts clean sheets (opponent scored 0) and failed-to-score (team scored 0)", () => {
    const fixtures = [
      // home, 2-0 → clean sheet
      fx({
        id: "a",
        date: "2024-08-01",
        homeTeamId: TEAM,
        awayTeamId: 2,
        homeScore: 2,
        awayScore: 0,
      }),
      // away, lost 1-0 → failed to score
      fx({
        id: "b",
        date: "2024-08-08",
        homeTeamId: 3,
        awayTeamId: TEAM,
        homeScore: 1,
        awayScore: 0,
      }),
      // home, 0-0 → both clean sheet AND failed to score
      fx({
        id: "c",
        date: "2024-08-15",
        homeTeamId: TEAM,
        awayTeamId: 4,
        homeScore: 0,
        awayScore: 0,
      }),
    ];
    const agg = aggregateTeamSeasonStats(fixtures, TEAM);
    expect(agg.cleanSheets).toBe(2); // matches a + c
    expect(agg.failedToScore).toBe(2); // matches b + c
  });

  it("ignores incomplete matches and other teams' fixtures", () => {
    const fixtures = [
      fx({
        id: "a",
        date: "2024-08-01",
        homeTeamId: TEAM,
        awayTeamId: 2,
        homeScore: null,
        awayScore: null,
      }),
      fx({ id: "b", date: "2024-08-08", homeTeamId: 3, awayTeamId: 4, homeScore: 5, awayScore: 0 }),
    ];
    const agg = aggregateTeamSeasonStats(fixtures, TEAM);
    expect(agg.cleanSheets).toBe(0);
    expect(agg.failedToScore).toBe(0);
    expect(agg.longestWinStreak).toBe(0);
  });

  it("computes longest win / losing / unbeaten streaks chronologically", () => {
    // W W D L L W  (unbeaten run = W W D = 3; win run = 2; lose run = 2)
    const results: Array<[string, number, number]> = [
      ["a", 2, 0], // W
      ["b", 1, 0], // W
      ["c", 1, 1], // D
      ["d", 0, 1], // L
      ["e", 0, 2], // L
      ["f", 3, 1], // W
    ];
    const fixtures = results.map(([id, hs, as], i) =>
      fx({
        id,
        date: `2024-08-${String(i + 1).padStart(2, "0")}`,
        homeTeamId: TEAM,
        awayTeamId: 99,
        homeScore: hs,
        awayScore: as,
      }),
    );
    const agg = aggregateTeamSeasonStats(fixtures, TEAM);
    expect(agg.longestWinStreak).toBe(2);
    expect(agg.longestLosingStreak).toBe(2);
    expect(agg.longestUnbeaten).toBe(3); // W W D
  });

  it("averages per-match team stats (rounded to 1dp) from the team's side, home or away", () => {
    const fixtures = [
      // team at home → reads teamStats.home (10 shots, 5 SoT, 4 corners, 8 fouls)
      fx({
        id: "a",
        date: "2024-08-01",
        homeTeamId: TEAM,
        awayTeamId: 2,
        homeScore: 1,
        awayScore: 0,
        teamStats: {
          home: ms({ shots: 10, shotsOnTarget: 5, corners: 4, fouls: 8 }),
          away: ms({ shots: 99 }),
        },
      }),
      // team away → reads teamStats.away (15 shots, 6 SoT, 7 corners, 12 fouls)
      fx({
        id: "b",
        date: "2024-08-08",
        homeTeamId: 3,
        awayTeamId: TEAM,
        homeScore: 0,
        awayScore: 0,
        teamStats: {
          home: ms({ shots: 99 }),
          away: ms({ shots: 15, shotsOnTarget: 6, corners: 7, fouls: 12 }),
        },
      }),
    ];
    const agg = aggregateTeamSeasonStats(fixtures, TEAM);
    expect(agg.avgShots).toBe(12.5); // (10+15)/2
    expect(agg.avgShotsOnTarget).toBe(5.5); // (5+6)/2
    expect(agg.avgCorners).toBe(5.5); // (4+7)/2
    expect(agg.avgFouls).toBe(10); // (8+12)/2
  });

  it("sums season card totals from the team's side", () => {
    const fixtures = [
      fx({
        id: "a",
        date: "2024-08-01",
        homeTeamId: TEAM,
        awayTeamId: 2,
        homeScore: 1,
        awayScore: 0,
        teamStats: { home: ms({ yellowCards: 2, redCards: 1 }), away: ms({ yellowCards: 9 }) },
      }),
      fx({
        id: "b",
        date: "2024-08-08",
        homeTeamId: 3,
        awayTeamId: TEAM,
        homeScore: 0,
        awayScore: 0,
        teamStats: { home: ms({ yellowCards: 9 }), away: ms({ yellowCards: 3, redCards: 0 }) },
      }),
    ];
    const agg = aggregateTeamSeasonStats(fixtures, TEAM);
    expect(agg.yellowCards).toBe(5); // 2 + 3
    expect(agg.redCards).toBe(1); // 1 + 0
  });

  it("returns null per-game + card stats when no completed match has teamStats (pre-2000)", () => {
    const fixtures = [
      fx({
        id: "a",
        date: "1996-08-01",
        homeTeamId: TEAM,
        awayTeamId: 2,
        homeScore: 2,
        awayScore: 1,
        teamStats: null,
      }),
      fx({
        id: "b",
        date: "1996-08-08",
        homeTeamId: 3,
        awayTeamId: TEAM,
        homeScore: 0,
        awayScore: 0,
        teamStats: null,
      }),
    ];
    const agg = aggregateTeamSeasonStats(fixtures, TEAM);
    // results-only fields still computed
    expect(agg.cleanSheets).toBe(1); // the 0-0
    expect(agg.longestUnbeaten).toBe(2);
    // per-game + cards gracefully null
    expect(agg.avgShots).toBeNull();
    expect(agg.avgShotsOnTarget).toBeNull();
    expect(agg.avgCorners).toBeNull();
    expect(agg.avgFouls).toBeNull();
    expect(agg.yellowCards).toBeNull();
    expect(agg.redCards).toBeNull();
  });
});
