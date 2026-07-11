/**
 * Tests for `src/features/leagues/fixtures.api.ts` — post TASK-505
 * snapshot migration.
 *
 * `getNextFixtures` and `getRecentResults` now read from the committed JSON
 * snapshot via `loadFixtures` (src/data/loaders.ts) rather than hitting
 * wire over HTTP. These tests verify:
 *   - correct synthesis of the wire `Fixture` envelope from the flat
 *     snapshot shape so `<FixturesRail>` keeps working without modification
 *   - correct date-based filtering (next = future, last = past+completed)
 *   - correct sort order (next: soonest first; last: latest first)
 *   - count/slice is respected
 *   - graceful null on missing season
 *   - logo path is `/logos/{teamId}.png`
 *   - winner flag logic (true/false/null)
 *
 * Live data facts (data/fixtures-2024.json, 2024-25 season, now complete):
 *   First fixture:  2024-08-16-MUN-FUL  Man United 1-0 Fulham
 *   Last fixtures:  2025-05-25 (final day — 10 simultaneous matches)
 *   Total:          380 fixtures, all in the past as of 2026-05-25
 *
 * Because the season is complete, `getNextFixtures({ season: 2024 })` will
 * always return [] — this is the correct graceful empty state (the dashboard
 * rail shows "No upcoming fixtures.").
 */
import { describe, expect, it, vi, afterEach } from "vitest";

import {
  getNextFixtures,
  getRecentResults,
  getSeasonFixtures,
} from "@/features/leagues/fixtures.api";
import { getEntityNames, makeEntityNames } from "@/features/i18n/entity-names";

// TASK-1606: keep the real resolver factory + identity, but let a test drive the
// active locale. Default is identity (Latin) so every other test is unchanged.
vi.mock("@/features/i18n/entity-names", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/i18n/entity-names")>();
  return { ...actual, getEntityNames: vi.fn(async () => actual.IDENTITY_NAMES) };
});

afterEach(() => {
  vi.useRealTimers();
});

describe("getRecentResults — snapshot adapter", () => {
  it("returns a non-null array for season 2024", async () => {
    const result = await getRecentResults({ season: 2024 });

    expect(result).not.toBeNull();
    expect(result!.length).toBeGreaterThan(0);
    expect(result!.length).toBeLessThanOrEqual(5);
  });

  it("defaults to 5 results when count is omitted", async () => {
    const result = await getRecentResults({ season: 2024 });

    expect(result!.length).toBe(5);
  });

  it("respects a custom count argument", async () => {
    const result = await getRecentResults({ season: 2024, count: 3 });

    expect(result!.length).toBe(3);
  });

  it("returns fixtures sorted latest-first", async () => {
    const result = await getRecentResults({ season: 2024, count: 10 });

    const dates = result!.map((f) => f.fixture.date);
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i] <= dates[i - 1]).toBe(true);
    }
  });

  it("synthesizes the wire Fixture envelope shape", async () => {
    const result = await getRecentResults({ season: 2024, count: 1 });

    const fx = result![0];
    // fixture sub-object
    expect(typeof fx.fixture.id).toBe("string");
    expect(typeof fx.fixture.date).toBe("string");
    expect(typeof fx.fixture.timestamp).toBe("number");
    // teams sub-objects
    expect(typeof fx.teams.home.id).toBe("number");
    expect(typeof fx.teams.home.name).toBe("string");
    expect(typeof fx.teams.home.logo).toBe("string");
    expect(typeof fx.teams.away.id).toBe("number");
    // goals
    expect(typeof fx.goals.home === "number" || fx.goals.home === null).toBe(true);
    expect(typeof fx.goals.away === "number" || fx.goals.away === null).toBe(true);
  });

  it("maps team logos to /logos/{teamId}.png", async () => {
    const result = await getRecentResults({ season: 2024, count: 5 });

    for (const fx of result!) {
      expect(fx.teams.home.logo).toBe(`/logos/${fx.teams.home.id}.png`);
      expect(fx.teams.away.logo).toBe(`/logos/${fx.teams.away.id}.png`);
    }
  });

  it("sets fixture.id to the snapshot string id (passed through unchanged)", async () => {
    const result = await getRecentResults({ season: 2024, count: 5 });

    for (const fx of result!) {
      expect(typeof fx.fixture.id).toBe("string");
      // snapshot id format: YYYY-MM-DD-HHH-AAA
      expect(fx.fixture.id).toMatch(/^\d{4}-\d{2}-\d{2}-[A-Z]{3}-[A-Z]{3}$/);
    }
  });

  it("winner flag is true/false/null — not missing or undefined", async () => {
    const result = await getRecentResults({ season: 2024, count: 5 });

    for (const fx of result!) {
      const { home, away } = fx.teams;
      const validValues = [true, false, null];
      expect(validValues).toContain(home.winner);
      expect(validValues).toContain(away.winner);
    }
  });

  it("winner flag correctly reflects the score — winning side is true, losing side is false", async () => {
    // Man United 1-0 Fulham (first fixture of the season)
    const result = await getRecentResults({ season: 2024, count: 380 });
    const manUtdFulham = result!.find(
      (f) => f.teams.home.name === "Man United" && f.teams.away.name === "Fulham",
    );
    expect(manUtdFulham).toBeDefined();
    expect(manUtdFulham!.teams.home.winner).toBe(true); // Man United won
    expect(manUtdFulham!.teams.away.winner).toBe(false); // Fulham lost
  });

  it("winner flag is null for both teams in a draw", async () => {
    const result = await getRecentResults({ season: 2024, count: 380 });
    // Find a drawn fixture: homeScore === awayScore
    const draw = result!.find((f) => f.goals.home !== null && f.goals.home === f.goals.away);
    expect(draw).toBeDefined();
    expect(draw!.teams.home.winner).toBeNull();
    expect(draw!.teams.away.winner).toBeNull();
  });

  it("only returns completed fixtures (homeScore + awayScore are not null)", async () => {
    const result = await getRecentResults({ season: 2024, count: 380 });

    for (const fx of result!) {
      expect(fx.goals.home).not.toBeNull();
      expect(fx.goals.away).not.toBeNull();
    }
  });

  it("fixture.status.short is FT for completed fixtures", async () => {
    const result = await getRecentResults({ season: 2024, count: 5 });

    for (const fx of result!) {
      expect(fx.fixture.status.short).toBe("FT");
    }
  });

  it("returns null for a season with no committed snapshot", async () => {
    const result = await getRecentResults({ season: 2099 });

    expect(result).toBeNull();
  });
});

describe("getNextFixtures — snapshot adapter", () => {
  it("returns [] for season 2024 (all fixtures are in the past)", async () => {
    // The 2024-25 PL season is complete as of 2025-05-25; all 380 fixtures
    // are in the past. getNextFixtures correctly returns an empty array,
    // which causes <FixturesRail> to render "No upcoming fixtures."
    const result = await getNextFixtures({ season: 2024 });

    expect(result).not.toBeNull();
    expect(result).toEqual([]);
  });

  it("returns future fixtures only when the clock is set to before the season", async () => {
    // Mock the current time to 2024-08-15 (one day before the first fixture).
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-08-15T00:00:00Z"));

    const result = await getNextFixtures({ season: 2024 });

    expect(result).not.toBeNull();
    expect(result!.length).toBeGreaterThan(0);
    expect(result!.length).toBeLessThanOrEqual(5);

    vi.useRealTimers();
  });

  it("returns fixtures sorted soonest-first when clock is mid-season", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-08-15T00:00:00Z"));

    const result = await getNextFixtures({ season: 2024, count: 5 });

    const dates = result!.map((f) => f.fixture.date);
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i] >= dates[i - 1]).toBe(true);
    }

    vi.useRealTimers();
  });

  it("first upcoming fixture is Man United vs Fulham on 2024-08-16 when clock is set to 2024-08-15", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-08-15T00:00:00Z"));

    const result = await getNextFixtures({ season: 2024, count: 1 });

    expect(result!.length).toBe(1);
    expect(result![0].teams.home.name).toBe("Man United");
    expect(result![0].teams.away.name).toBe("Fulham");
    expect(result![0].fixture.date).toBe("2024-08-16T20:00:00Z");

    vi.useRealTimers();
  });

  it("respects count argument when upcoming fixtures are available", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-08-15T00:00:00Z"));

    const result = await getNextFixtures({ season: 2024, count: 3 });

    expect(result!.length).toBe(3);

    vi.useRealTimers();
  });

  it("upcoming fixture.status.short is NS (not started — date > now)", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-08-15T00:00:00Z"));

    const result = await getNextFixtures({ season: 2024, count: 3 });

    for (const fx of result!) {
      // Status is derived from date comparison, not score presence.
      // Any fixture whose date is still in the future is "NS".
      expect(fx.fixture.status.short).toBe("NS");
    }

    vi.useRealTimers();
  });

  it("upcoming fixture winner flags are null (game not played yet)", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-08-15T00:00:00Z"));

    const result = await getNextFixtures({ season: 2024, count: 3 });

    // Because the fixture date is in the future (isPlayed = false), the
    // winner flag is forced to null even though the snapshot complete-season
    // snapshot carries the actual final scores.
    for (const fx of result!) {
      expect(fx.teams.home.winner).toBeNull();
      expect(fx.teams.away.winner).toBeNull();
    }

    vi.useRealTimers();
  });

  it("maps team logos to /logos/{teamId}.png", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-08-15T00:00:00Z"));

    const result = await getNextFixtures({ season: 2024, count: 3 });

    for (const fx of result!) {
      expect(fx.teams.home.logo).toBe(`/logos/${fx.teams.home.id}.png`);
      expect(fx.teams.away.logo).toBe(`/logos/${fx.teams.away.id}.png`);
    }

    vi.useRealTimers();
  });

  it("returns null for a season with no committed snapshot", async () => {
    const result = await getNextFixtures({ season: 2099 });

    expect(result).toBeNull();
  });
});

describe("getSeasonFixtures — all fixtures for a season (TASK-M12)", () => {
  it("returns every fixture for season 2024 (380 matches)", async () => {
    const result = await getSeasonFixtures({ season: 2024 });

    expect(result).not.toBeNull();
    expect(result!.length).toBe(380);
  });

  it("returns fixtures sorted soonest-first (ascending by date)", async () => {
    const result = await getSeasonFixtures({ season: 2024 });

    const dates = result!.map((f) => f.fixture.date);
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i] >= dates[i - 1]).toBe(true);
    }
  });

  it("the first fixture is the opener Man United vs Fulham", async () => {
    const result = await getSeasonFixtures({ season: 2024 });

    expect(result![0].teams.home.name).toBe("Man United");
    expect(result![0].teams.away.name).toBe("Fulham");
  });

  it("returns null for a season with no committed snapshot", async () => {
    const result = await getSeasonFixtures({ season: 2099 });

    expect(result).toBeNull();
  });
});

describe("getNextFixtures + getRecentResults — shared contract", () => {
  it("both return the wire Fixture type (league id = 39)", async () => {
    const recent = await getRecentResults({ season: 2024, count: 1 });

    expect(recent![0].league.id).toBe(39);
  });

  it("fixture.id is stable across multiple calls (same string id returned each time)", async () => {
    const [first, second] = await Promise.all([
      getRecentResults({ season: 2024, count: 5 }),
      getRecentResults({ season: 2024, count: 5 }),
    ]);

    for (let i = 0; i < 5; i++) {
      expect(first![i].fixture.id).toBe(second![i].fixture.id);
    }
  });

  it("module exports are functions (server-only check)", () => {
    expect(typeof getNextFixtures).toBe("function");
    expect(typeof getRecentResults).toBe("function");
  });
});

describe("toApiFixture — half-time score + referee (TASK-1302)", () => {
  it("maps halfTime + referee through for a modern fixture (Man United vs Fulham, HT 0–0, ref R Jones)", async () => {
    const result = await getRecentResults({ season: 2024, count: 380 });
    const manUtdFulham = result!.find(
      (f) => f.teams.home.name === "Man United" && f.teams.away.name === "Fulham",
    );
    expect(manUtdFulham).toBeDefined();
    expect(manUtdFulham!.score.halftime).toEqual({ home: 0, away: 0 });
    expect(manUtdFulham!.fixture.referee).toBe("R Jones");
  });

  it("every 2024 fixture carries a non-null referee and half-time score (modern era)", async () => {
    const result = await getRecentResults({ season: 2024, count: 380 });
    for (const fx of result!) {
      expect(typeof fx.fixture.referee).toBe("string");
      expect(fx.score.halftime.home).not.toBeNull();
      expect(fx.score.halftime.away).not.toBeNull();
    }
  });
});

describe("toApiFixture — Arabic entity names on /ar (TASK-1606)", () => {
  it("swaps team names + referee to Arabic when the resolver is /ar", async () => {
    const ar = makeEntityNames(
      {
        teams: { "33": "مانشستر يونايتد" },
        referees: { "r jones": "ر. جونز" },
        players: {},
        managers: {},
        venues: {},
        cities: {},
        positions: {},
        nationalities: {},
      },
      "ar",
    );
    vi.mocked(getEntityNames).mockResolvedValueOnce(ar);
    const result = await getRecentResults({ season: 2024, count: 380 });
    const united = result!.find((f) => f.teams.home.id === 33 || f.teams.away.id === 33);
    expect(united).toBeDefined();
    const unitedName =
      united!.teams.home.id === 33 ? united!.teams.home.name : united!.teams.away.name;
    expect(unitedName).toBe("مانشستر يونايتد");
  });

  it("localizes the venue (home stadium, keyed by the home team id) on /ar", async () => {
    const ar = makeEntityNames(
      {
        teams: {},
        referees: {},
        players: {},
        managers: {},
        venues: { "33": "أولد ترافورد" },
        cities: {},
        positions: {},
        nationalities: {},
      },
      "ar",
    );
    vi.mocked(getEntityNames).mockResolvedValueOnce(ar);
    const result = await getRecentResults({ season: 2024, count: 380 });
    // A fixture where Man United (33) is the HOME team → venue = Old Trafford.
    const homeGame = result!.find((f) => f.teams.home.id === 33);
    expect(homeGame).toBeDefined();
    expect(homeGame!.fixture.venue.name).toBe("أولد ترافورد");
  });

  it("defaults to Latin team names when the locale is not Arabic", async () => {
    const result = await getRecentResults({ season: 2024, count: 380 });
    const united = result!.find((f) => f.teams.home.id === 33 || f.teams.away.id === 33);
    const unitedName =
      united!.teams.home.id === 33 ? united!.teams.home.name : united!.teams.away.name;
    expect(unitedName).not.toBe("مانشستر يونايتد");
  });
});
