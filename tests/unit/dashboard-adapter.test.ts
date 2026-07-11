import { describe, expect, it } from "vitest";

import {
  toAssistsEntry,
  toGoalsEntry,
  toRedCardsEntry,
  toYellowCardsEntry,
} from "@/features/players/leaderboard-adapter";
import type { PlayerLeaderboardEntry } from "@/types/api";

function makeWireEntry(overrides: Partial<PlayerLeaderboardEntry> = {}): PlayerLeaderboardEntry {
  return {
    player: {
      id: 306,
      name: "Mohamed Salah",
      firstname: "Mohamed",
      lastname: "Salah",
      age: 33,
      birth: { date: "1992-06-15", place: null, country: "Egypt" },
      nationality: "Egypt",
      height: "175",
      weight: "71",
      injured: false,
      photo: "https://example.test/salah.png",
    },
    statistics: [
      {
        team: { id: 40, name: "Liverpool", logo: "https://example.test/lfc.png" },
        league: {
          id: 39,
          name: "Premier League",
          country: "England",
          logo: "https://example.test/pl.png",
          flag: "https://example.test/gb-eng.svg",
          season: 2024,
        },
        games: {
          appearences: 38,
          lineups: 38,
          minutes: 3377,
          number: null,
          position: "Attacker",
          rating: "7.792105",
          captain: false,
        },
        substitutes: { in: 0, out: null, bench: null },
        shots: { total: 104, on: 61 },
        goals: { total: 29, conceded: 0, assists: 18, saves: null },
        passes: { total: 1153, key: 91, accuracy: null },
        tackles: { total: 22, blocks: null, interceptions: 9 },
        duels: { total: 313, won: 127 },
        dribbles: { attempts: 130, success: 57, past: null },
        fouls: { drawn: 39, committed: 25 },
        cards: { yellow: 1, yellowred: null, red: 0 },
        penalty: {
          won: null,
          commited: null,
          scored: 9,
          missed: 0,
          saved: null,
        },
      },
    ],
    ...overrides,
  };
}

describe("toGoalsEntry — wire → StatLeaderboardEntry", () => {
  it("derives rank from the array index (1-based)", () => {
    const entry = toGoalsEntry(makeWireEntry(), 0);
    expect(entry.rank).toBe(1);

    const fourth = toGoalsEntry(makeWireEntry(), 3);
    expect(fourth.rank).toBe(4);
  });

  it("copies player name and photo verbatim from the wire entry", () => {
    const entry = toGoalsEntry(makeWireEntry(), 0);
    expect(entry.name).toBe("Mohamed Salah");
    expect(entry.photo).toBe("https://example.test/salah.png");
  });

  it("reads the team name from the first statistics record", () => {
    const entry = toGoalsEntry(makeWireEntry(), 0);
    expect(entry.team).toBe("Liverpool");
  });

  it("uses goals.total as the value", () => {
    const entry = toGoalsEntry(makeWireEntry(), 0);
    expect(entry.value).toBe(29);
  });

  it("falls back to 0 when goals.total is null", () => {
    const wire = makeWireEntry();
    const stats = wire.statistics[0];
    const entry = toGoalsEntry(
      {
        ...wire,
        statistics: [{ ...stats, goals: { ...stats.goals, total: null } }],
      },
      0,
    );
    expect(entry.value).toBe(0);
  });

  it("falls back to '—' team and 0 value when statistics is empty", () => {
    const wire = makeWireEntry();
    const entry = toGoalsEntry({ ...wire, statistics: [] }, 0);
    expect(entry.team).toBe("—");
    expect(entry.value).toBe(0);
    // Player-level fields still propagate.
    expect(entry.name).toBe("Mohamed Salah");
  });
});

describe("toAssistsEntry — uses goals.assists for value", () => {
  it("reads stats.goals.assists into value", () => {
    expect(toAssistsEntry(makeWireEntry(), 0).value).toBe(18);
  });

  it("falls back to 0 when assists is null", () => {
    const wire = makeWireEntry();
    const stats = wire.statistics[0];
    expect(
      toAssistsEntry(
        {
          ...wire,
          statistics: [{ ...stats, goals: { ...stats.goals, assists: null } }],
        },
        0,
      ).value,
    ).toBe(0);
  });
});

describe("toYellowCardsEntry — uses cards.yellow for value", () => {
  it("reads stats.cards.yellow into value", () => {
    expect(toYellowCardsEntry(makeWireEntry(), 0).value).toBe(1);
  });

  it("falls back to 0 when yellow is null", () => {
    const wire = makeWireEntry();
    const stats = wire.statistics[0];
    expect(
      toYellowCardsEntry(
        {
          ...wire,
          statistics: [{ ...stats, cards: { ...stats.cards, yellow: null } }],
        },
        0,
      ).value,
    ).toBe(0);
  });
});

describe("toRedCardsEntry — uses cards.red for value", () => {
  it("reads stats.cards.red into value", () => {
    expect(toRedCardsEntry(makeWireEntry(), 0).value).toBe(0);
  });

  it("falls back to 0 when red is null", () => {
    const wire = makeWireEntry();
    const stats = wire.statistics[0];
    expect(
      toRedCardsEntry(
        {
          ...wire,
          statistics: [{ ...stats, cards: { ...stats.cards, red: null } }],
        },
        0,
      ).value,
    ).toBe(0);
  });

  it("falls back to '—' team and 0 value when statistics is empty (parallel to toGoalsEntry)", () => {
    const wire = makeWireEntry();
    const entry = toRedCardsEntry({ ...wire, statistics: [] }, 0);
    expect(entry.team).toBe("—");
    expect(entry.value).toBe(0);
  });
});
