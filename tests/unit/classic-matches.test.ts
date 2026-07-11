import { describe, expect, it } from "vitest";

import { classicMatches } from "@/features/leagues/classic-matches";
import type { Fixture, Standing } from "@/data/schemas";

// teamId === rank, so team 1 is the leader and team N is bottom — keeps the
// scenarios easy to reason about.
function table(n: number): Standing[] {
  return Array.from({ length: n }, (_, i) => ({
    rank: i + 1,
    teamId: i + 1,
    teamName: `Team ${i + 1}`,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalsDiff: 0,
    points: 0,
  }));
}

function fx(o: {
  id: string;
  home: number;
  away: number;
  hs?: number | null;
  as?: number | null;
  date?: string;
  ht?: { home: number; away: number } | null;
}): Fixture {
  return {
    id: o.id,
    date: o.date ?? "2024-08-16T14:00:00Z",
    homeTeamId: o.home,
    awayTeamId: o.away,
    homeTeamName: `Team ${o.home}`,
    awayTeamName: `Team ${o.away}`,
    homeScore: o.hs ?? null,
    awayScore: o.as ?? null,
    venue: "",
    teamStats: null,
    halfTime: o.ht ?? null,
    referee: null,
  };
}

describe("classicMatches — ranking", () => {
  it("ranks a big-team clash above a bottom-table clash (same scoreline)", () => {
    const result = classicMatches(
      [
        fx({ id: "bottom", home: 5, away: 6, hs: 1, as: 0 }),
        fx({ id: "top", home: 1, away: 2, hs: 1, as: 0 }),
      ],
      table(6),
    );
    expect(result[0].fixture.id).toBe("top");
  });

  it("only considers completed fixtures (null scores excluded)", () => {
    const result = classicMatches(
      [
        fx({ id: "played", home: 1, away: 2, hs: 2, as: 1 }),
        fx({ id: "unplayed", home: 1, away: 3, hs: null, as: null }),
      ],
      table(6),
    );
    expect(result.map((m) => m.fixture.id)).toEqual(["played"]);
  });

  it("returns [] when there are no standings", () => {
    expect(classicMatches([fx({ id: "a", home: 1, away: 2, hs: 1, as: 0 })], [])).toEqual([]);
  });

  it("breaks score ties deterministically by fixture id (ascending)", () => {
    const result = classicMatches(
      [
        fx({ id: "2024-02-02-CCC-DDD", home: 3, away: 4, hs: 1, as: 1 }),
        fx({ id: "2024-01-01-CCC-DDD", home: 3, away: 4, hs: 1, as: 1 }),
      ],
      table(6),
    );
    expect(result.map((m) => m.fixture.id)).toEqual(["2024-01-01-CCC-DDD", "2024-02-02-CCC-DDD"]);
  });

  it("enforces the max-2-per-club diversity guard", () => {
    // Team 1 features in four high-scoring matches; only two may be picked.
    const result = classicMatches(
      [
        fx({ id: "m1", home: 1, away: 2, hs: 3, as: 2 }),
        fx({ id: "m2", home: 1, away: 3, hs: 4, as: 1 }),
        fx({ id: "m3", home: 1, away: 4, hs: 5, as: 0 }),
        fx({ id: "m4", home: 1, away: 5, hs: 3, as: 3 }),
        // A non-team-1 match so there's something else to fill the rail.
        fx({ id: "m5", home: 2, away: 3, hs: 2, as: 2 }),
      ],
      table(6),
    );
    const team1Count = result.filter(
      (m) => m.fixture.homeTeamId === 1 || m.fixture.awayTeamId === 1,
    ).length;
    expect(team1Count).toBeLessThanOrEqual(2);
  });

  it("honours the limit option", () => {
    const fixtures = Array.from({ length: 10 }, (_, i) =>
      fx({ id: `f${i}`, home: ((i * 2) % 6) + 1, away: ((i * 2 + 1) % 6) + 1, hs: 2, as: 1 }),
    );
    expect(classicMatches(fixtures, table(6), { limit: 3 }).length).toBeLessThanOrEqual(3);
  });
});

describe("classicMatches — catalyst badges", () => {
  it("labels a 5+ goal game a goal thriller (key + total)", () => {
    const result = classicMatches([fx({ id: "g", home: 3, away: 4, hs: 4, as: 3 })], table(6));
    expect(result[0].badge).toEqual({ key: "goalThriller", total: 7 });
  });

  it("labels a low-scoring half-time comeback an epic comeback", () => {
    // 0-1 down at the break, 2-1 at full time → comeback, 3 goals (< 5, so the
    // comeback is the headline rather than a goal-fest).
    const result = classicMatches(
      [fx({ id: "c", home: 3, away: 4, hs: 2, as: 1, ht: { home: 0, away: 1 } })],
      table(6),
    );
    expect(result[0].badge).toEqual({ key: "badgeEpicComeback" });
  });

  it("a high-scoring comeback reads as a thriller (goals are the headline)", () => {
    // 0-2 down at the break, 3-2 at full time → still a comeback, but 5 goals
    // → the thriller label wins. (The comeback term still boosts the ranking.)
    const result = classicMatches(
      [fx({ id: "c", home: 3, away: 4, hs: 3, as: 2, ht: { home: 0, away: 2 } })],
      table(6),
    );
    expect(result[0].badge).toEqual({ key: "goalThriller", total: 5 });
  });

  it("labels a late-season match involving a title side a title-race decider", () => {
    // N=6 → late threshold is the 6th of a team's matches. Team 1 (leader)
    // plays six in date order; the last is late + title side, 1-0 (not a
    // thriller, no comeback).
    const dates = ["08-01", "08-08", "08-15", "08-22", "08-29", "09-05"];
    const opps = [2, 3, 4, 5, 6, 4];
    const fixtures = dates.map((d, i) =>
      fx({ id: `t${i}`, home: 1, away: opps[i], hs: 1, as: 0, date: `2024-${d}T14:00:00Z` }),
    );
    const result = classicMatches(fixtures, table(6));
    expect(result[0].fixture.id).toBe("t5");
    expect(result[0].badge).toEqual({ key: "badgeTitleDecider" });
  });

  it("labels a late-season relegation clash a relegation battle", () => {
    // Two bottom-four sides (5 & 6), neither top-2, late in the season.
    const dates = ["08-01", "08-08", "08-15", "08-22", "08-29", "09-05"];
    const opps = [3, 4, 3, 4, 3, 6];
    const fixtures = dates.map((d, i) =>
      fx({ id: `r${i}`, home: 5, away: opps[i], hs: 1, as: 0, date: `2024-${d}T14:00:00Z` }),
    );
    const result = classicMatches(fixtures, table(6));
    const last = result.find((m) => m.fixture.id === "r5");
    expect(last?.badge).toEqual({ key: "badgeRelegationBattle" });
  });

  it("labels an ordinary strong clash a marquee clash", () => {
    const result = classicMatches([fx({ id: "m", home: 1, away: 2, hs: 1, as: 0 })], table(6));
    expect(result[0].badge).toEqual({ key: "badgeMarquee" });
  });
});
