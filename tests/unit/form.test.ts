import { describe, expect, it } from "vitest";

import { synthesizeForm } from "@/features/leagues/form";
import type { Fixture } from "@/data/schemas";

/** Minimal Fixture factory — only the fields synthesizeForm reads matter. */
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

describe("synthesizeForm", () => {
  const TEAM = 10;

  it("returns '' when the team has no completed matches", () => {
    const fixtures = [
      fx({
        id: "a",
        date: "2024-08-01",
        homeTeamId: TEAM,
        awayTeamId: 2,
        homeScore: null,
        awayScore: null,
      }),
      fx({ id: "b", date: "2024-08-08", homeTeamId: 3, awayTeamId: 4, homeScore: 1, awayScore: 0 }),
    ];
    expect(synthesizeForm(fixtures, TEAM)).toBe("");
  });

  it("scores a home win as W, away win as L, draw as D — from the team's perspective", () => {
    const fixtures = [
      // team at home, wins 2-0 → W
      fx({
        id: "a",
        date: "2024-08-01",
        homeTeamId: TEAM,
        awayTeamId: 2,
        homeScore: 2,
        awayScore: 0,
      }),
      // team away, loses 0-1 → L
      fx({
        id: "b",
        date: "2024-08-08",
        homeTeamId: 3,
        awayTeamId: TEAM,
        homeScore: 1,
        awayScore: 0,
      }),
      // team home, draws 1-1 → D
      fx({
        id: "c",
        date: "2024-08-15",
        homeTeamId: TEAM,
        awayTeamId: 4,
        homeScore: 1,
        awayScore: 1,
      }),
    ];
    expect(synthesizeForm(fixtures, TEAM)).toBe("WLD");
  });

  it("orders oldest-left, newest-right and ignores fixture input order", () => {
    const fixtures = [
      fx({
        id: "c",
        date: "2024-08-15",
        homeTeamId: TEAM,
        awayTeamId: 4,
        homeScore: 0,
        awayScore: 3,
      }), // L (newest)
      fx({
        id: "a",
        date: "2024-08-01",
        homeTeamId: TEAM,
        awayTeamId: 2,
        homeScore: 2,
        awayScore: 0,
      }), // W (oldest)
      fx({
        id: "b",
        date: "2024-08-08",
        homeTeamId: TEAM,
        awayTeamId: 3,
        homeScore: 1,
        awayScore: 1,
      }), // D (middle)
    ];
    expect(synthesizeForm(fixtures, TEAM)).toBe("WDL");
  });

  it("keeps only the last 5 completed matches", () => {
    const fixtures = Array.from({ length: 7 }, (_, i) =>
      fx({
        id: `m${i}`,
        date: `2024-08-0${i + 1}`,
        homeTeamId: TEAM,
        awayTeamId: 99,
        homeScore: 1, // all home wins → "W"
        awayScore: 0,
      }),
    );
    const form = synthesizeForm(fixtures, TEAM);
    expect(form).toBe("WWWWW");
    expect(form).toHaveLength(5);
  });

  it("returns a short string when fewer than 5 completed matches exist", () => {
    const fixtures = [
      fx({
        id: "a",
        date: "2024-08-01",
        homeTeamId: TEAM,
        awayTeamId: 2,
        homeScore: 0,
        awayScore: 0,
      }), // D
      fx({
        id: "b",
        date: "2024-08-08",
        homeTeamId: 2,
        awayTeamId: TEAM,
        homeScore: 0,
        awayScore: 2,
      }), // W (away)
    ];
    expect(synthesizeForm(fixtures, TEAM)).toBe("DW");
  });

  it("breaks same-date ties deterministically by fixture id", () => {
    const fixtures = [
      fx({
        id: "z",
        date: "2024-08-01",
        homeTeamId: TEAM,
        awayTeamId: 2,
        homeScore: 0,
        awayScore: 1,
      }), // L, id "z" → later
      fx({
        id: "a",
        date: "2024-08-01",
        homeTeamId: TEAM,
        awayTeamId: 3,
        homeScore: 3,
        awayScore: 0,
      }), // W, id "a" → earlier
    ];
    expect(synthesizeForm(fixtures, TEAM)).toBe("WL");
  });
});
