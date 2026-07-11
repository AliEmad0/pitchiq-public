import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getFixtureDetail } from "@/features/leagues/fixture-detail.api";
import {
  loadFixture,
  loadLineup,
  loadEvents,
  loadTeamColors,
  loadFixtureExtras,
  loadPlayers,
  loadManagers,
} from "@/data/loaders";
import type { Fixture as SnapshotFixture } from "@/data/schemas";
import { getEntityNames, makeEntityNames } from "@/features/i18n/entity-names";
import { currentDataSeason } from "@/utils/season";

vi.mock("@/data/loaders", () => ({
  loadClubLogos: vi.fn(async () => null),
  loadFixture: vi.fn(),
  loadFixtures: vi.fn(), // declared because the same module exports it; harmless
  loadLineup: vi.fn(),
  loadEvents: vi.fn(),
  loadTeamColors: vi.fn(async () => null),
  loadFixtureExtras: vi.fn(async () => null),
  loadPlayers: vi.fn(async () => null),
  loadManagers: vi.fn(async () => null),
}));

// Resolver defaults to identity (Latin); the /ar test overrides it once.
vi.mock("@/features/i18n/entity-names", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/i18n/entity-names")>();
  return { ...actual, getEntityNames: vi.fn(async () => actual.IDENTITY_NAMES) };
});

const FIXTURE_ID = "2024-08-16-MUN-FUL";

function kFixture(overrides: Partial<SnapshotFixture> = {}): SnapshotFixture {
  return {
    id: FIXTURE_ID,
    date: "2024-08-16T19:00:00Z",
    homeTeamId: 33,
    awayTeamId: 36,
    homeTeamName: "Man United",
    awayTeamName: "Fulham",
    homeScore: 1,
    awayScore: 0,
    venue: "Old Trafford",
    teamStats: {
      home: {
        shots: 14,
        shotsOnTarget: 5,
        corners: 7,
        fouls: 12,
        yellowCards: 2,
        redCards: 0,
      },
      away: {
        shots: 10,
        shotsOnTarget: 2,
        corners: 8,
        fouls: 10,
        yellowCards: 3,
        redCards: 0,
      },
    },
    halfTime: null,
    referee: null,
    ...overrides,
  };
}

describe("getFixtureDetail", () => {
  beforeEach(() => {
    vi.mocked(loadFixture).mockReset();
    vi.mocked(loadLineup).mockReset().mockResolvedValue(null);
    vi.mocked(loadEvents).mockReset().mockResolvedValue([]);
    vi.mocked(loadTeamColors).mockReset().mockResolvedValue(null);
    vi.mocked(loadFixtureExtras).mockReset().mockResolvedValue(null);
    vi.mocked(loadPlayers).mockReset().mockResolvedValue(null);
    vi.mocked(loadManagers).mockReset().mockResolvedValue(null);
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the synthesized FixtureDetail on the happy path", async () => {
    vi.mocked(loadFixture).mockResolvedValueOnce(kFixture());

    const detail = await getFixtureDetail(FIXTURE_ID, 2024);

    expect(detail).not.toBeNull();
    expect(detail?.fixture.fixture.id).toBe(FIXTURE_ID); // string passthrough
    expect(detail?.fixture.teams.home.name).toBe("Man United");
    expect(detail?.fixture.teams.away.name).toBe("Fulham");
    expect(detail?.fixture.goals.home).toBe(1);
    expect(detail?.fixture.goals.away).toBe(0);
  });

  it("returns lineups: [] and events: [] when no lineup data exists", async () => {
    vi.mocked(loadFixture).mockResolvedValueOnce(kFixture());
    // loadLineup → null, loadEvents → [] (default mocks)

    const detail = await getFixtureDetail(FIXTURE_ID, 2024);

    expect(detail?.lineups).toEqual([]);
    expect(detail?.events).toEqual([]);
  });

  it("reshapes loaded lineups + events into FixtureDetail", async () => {
    vi.mocked(loadFixture).mockResolvedValueOnce(kFixture());
    vi.mocked(loadLineup).mockResolvedValueOnce({
      home: {
        teamId: 33,
        formation: "4-3-3",
        manager: "Erik ten Hag",
        startXI: [
          {
            id: 5,
            name: "Bruno",
            number: 8,
            pos: "Attacking Midfield",
            grid: "5:2",
            isCaptain: true,
          },
        ],
        substitutes: [],
      },
      away: { teamId: 36, formation: "4-4-2", startXI: [], substitutes: [] },
    });
    vi.mocked(loadEvents).mockResolvedValueOnce([
      {
        type: "Goal",
        detail: "Normal Goal",
        minute: 20,
        extra: null,
        teamId: 33,
        player: "Bruno",
        assist: null,
      },
    ]);

    const detail = await getFixtureDetail(FIXTURE_ID, 2024);

    expect(detail?.lineups).toHaveLength(2);
    const home = detail?.lineups.find((l) => l.team.id === 33);
    expect(home?.formation).toBe("4-3-3");
    expect(home?.startXI[0].player.name).toBe("Bruno");
    expect(home?.startXI[0].player.grid).toBe("5:2");
    // TASK-M21 — manager → coach.name; isCaptain rides on the player.
    expect(home?.coach.name).toBe("Erik ten Hag");
    expect(home?.startXI[0].player.isCaptain).toBe(true);
    // TASK-M47 — no team-colors map mocked → kit is null (graceful).
    expect(home?.kit).toBeNull();
    expect(detail?.events).toHaveLength(1);
    expect(detail?.events[0]).toMatchObject({
      type: "Goal",
      time: { elapsed: 20 },
      team: { id: 33 },
      player: { name: "Bruno" },
    });
  });

  it("attaches each side's kit color from the team-colors map (TASK-M47)", async () => {
    vi.mocked(loadFixture).mockResolvedValueOnce(kFixture());
    vi.mocked(loadLineup).mockResolvedValueOnce({
      home: { teamId: 33, formation: "4-3-3", startXI: [], substitutes: [] },
      away: { teamId: 36, formation: "4-4-2", startXI: [], substitutes: [] },
    });
    vi.mocked(loadTeamColors).mockResolvedValueOnce({
      "33": { home: "#DA291C", away: "#000000" },
      "36": { home: "#FFFFFF", away: "#000000" },
    });

    const detail = await getFixtureDetail(FIXTURE_ID, 2024);
    const home = detail?.lineups.find((l) => l.team.id === 33);
    const away = detail?.lineups.find((l) => l.team.id === 36);
    // Home XI wears the home kit; away XI wears the away kit.
    expect(home?.kit).toEqual({ fill: "#DA291C", text: "#ffffff" });
    expect(away?.kit).toEqual({ fill: "#000000", text: "#ffffff" });
  });

  it("synthesizes statistics from snapshot teamStats — 2 blocks of 6 rows each", async () => {
    vi.mocked(loadFixture).mockResolvedValueOnce(kFixture());

    const detail = await getFixtureDetail(FIXTURE_ID, 2024);

    expect(detail?.statistics).toHaveLength(2);
    expect(detail?.statistics[0].team.id).toBe(33); // home
    expect(detail?.statistics[1].team.id).toBe(36); // away
    expect(detail?.statistics[0].statistics).toHaveLength(6);
    // Assert representative rows.
    const homeShots = detail?.statistics[0].statistics.find((r) => r.type === "Shots");
    expect(homeShots?.value).toBe(14);
    const awayCorners = detail?.statistics[1].statistics.find((r) => r.type === "Corner Kicks");
    expect(awayCorners?.value).toBe(8);
    const homeReds = detail?.statistics[0].statistics.find((r) => r.type === "Red Cards");
    expect(homeReds?.value).toBe(0);
  });

  it("returns statistics: [] when snapshot has no teamStats for the fixture", async () => {
    vi.mocked(loadFixture).mockResolvedValueOnce(kFixture({ teamStats: null }));

    const detail = await getFixtureDetail(FIXTURE_ID, 2024);

    expect(detail?.statistics).toEqual([]);
    // Fixture + lineups + events still resolve normally.
    expect(detail?.fixture.fixture.id).toBe(FIXTURE_ID);
    expect(detail?.lineups).toEqual([]);
    expect(detail?.events).toEqual([]);
  });

  it("joins attendance + venue from the fixture-extras sidecar (TASK-M16)", async () => {
    vi.mocked(loadFixture).mockResolvedValueOnce(kFixture());
    vi.mocked(loadFixtureExtras).mockResolvedValueOnce({
      [FIXTURE_ID]: { attendance: 73297, venue: "Old Trafford" },
    });

    const detail = await getFixtureDetail(FIXTURE_ID, 2024);

    expect(detail?.fixture.fixture.attendance).toBe(73297);
    expect(detail?.fixture.fixture.venue.name).toBe("Old Trafford");
  });

  it("leaves attendance null and keeps the default venue when no extras exist", async () => {
    vi.mocked(loadFixture).mockResolvedValueOnce(kFixture());
    // loadFixtureExtras → null (default mock)

    const detail = await getFixtureDetail(FIXTURE_ID, 2024);

    expect(detail?.fixture.fixture.attendance ?? null).toBeNull();
    expect(detail?.fixture.fixture.venue.name).toBe("Old Trafford"); // from kFixture.venue
  });

  it("resolves lineup/event/manager names to stable ids by name (M21)", async () => {
    vi.mocked(loadFixture).mockResolvedValueOnce(kFixture());
    vi.mocked(loadLineup).mockResolvedValueOnce({
      home: {
        teamId: 33,
        formation: "4-3-3",
        manager: "Erik ten Hag",
        startXI: [{ id: 5, name: "Bruno Fernandes", number: 8, pos: "M", grid: "5:2" }],
        substitutes: [],
      },
      away: { teamId: 36, formation: "4-4-2", startXI: [], substitutes: [] },
    });
    vi.mocked(loadEvents).mockResolvedValueOnce([
      {
        type: "Goal",
        detail: "Normal Goal",
        minute: 20,
        extra: null,
        teamId: 33,
        player: "Bruno Fernandes",
        assist: null,
      },
    ]);
    vi.mocked(loadPlayers).mockResolvedValueOnce([
      {
        id: 1000208,
        name: "Bruno Fernandes",
        teamId: 33,
        teamName: "Man United",
        position: "Midfielder",
        photo: null,
        metrics: {
          appearances: 1,
          goals: 1,
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
        },
      },
    ]);
    vi.mocked(loadManagers).mockResolvedValueOnce({
      "2024": {
        "33": [
          { id: "12345", name: "Erik ten Hag", matches: 1, win: 1, draw: 0, loss: 0, gf: 1, ga: 0 },
        ],
      },
    });

    const detail = await getFixtureDetail(FIXTURE_ID, 2024);
    const home = detail?.lineups.find((l) => l.team.id === 33);
    expect(home?.startXI[0].player.profileId).toBe(1000208);
    expect(home?.coach.managerId).toBe("12345");
    expect(detail?.events[0].player.id).toBe(1000208);
  });

  // TASK-1606 follow-up: once M21 resolves a lineup/event/manager name to an id,
  // localize the DISPLAY name on /ar (was rendered Latin). Unresolved names
  // (no id) stay Latin — the fallback is intentional.
  it("localizes resolved lineup/event/manager names on /ar", async () => {
    vi.mocked(loadFixture).mockResolvedValueOnce(kFixture());
    vi.mocked(loadLineup).mockResolvedValueOnce({
      home: {
        teamId: 33,
        formation: "4-3-3",
        manager: "Erik ten Hag",
        startXI: [{ id: 5, name: "Bruno Fernandes", number: 8, pos: "M", grid: "5:2" }],
        substitutes: [],
      },
      away: { teamId: 36, formation: "4-4-2", startXI: [], substitutes: [] },
    });
    vi.mocked(loadEvents).mockResolvedValueOnce([
      {
        type: "Goal",
        detail: "Normal Goal",
        minute: 20,
        extra: null,
        teamId: 33,
        player: "Bruno Fernandes",
        assist: null,
      },
    ]);
    vi.mocked(loadPlayers).mockResolvedValueOnce([
      {
        id: 1000208,
        name: "Bruno Fernandes",
        teamId: 33,
        teamName: "Man United",
        position: "Midfielder",
        photo: null,
        metrics: {
          appearances: 1,
          goals: 1,
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
        },
      },
    ]);
    vi.mocked(loadManagers).mockResolvedValueOnce({
      "2024": {
        "33": [
          { id: "12345", name: "Erik ten Hag", matches: 1, win: 1, draw: 0, loss: 0, gf: 1, ga: 0 },
        ],
      },
    });
    vi.mocked(getEntityNames).mockResolvedValueOnce(
      makeEntityNames(
        {
          players: { "1000208": "برونو فيرنانديز" },
          managers: { "12345": "إريك تن هاخ" },
          teams: { "33": "مانشستر يونايتد", "36": "فولهام" },
          venues: {},
          cities: {},
          referees: {},
          positions: {},
          nationalities: {},
        },
        "ar",
      ),
    );

    const detail = await getFixtureDetail(FIXTURE_ID, 2024);
    const home = detail?.lineups.find((l) => l.team.id === 33);
    // Display names flip to Arabic; the resolved ids are unchanged (links still work).
    expect(home?.startXI[0].player.name).toBe("برونو فيرنانديز");
    expect(home?.startXI[0].player.profileId).toBe(1000208);
    expect(home?.coach.name).toBe("إريك تن هاخ");
    expect(detail?.events[0].player.name).toBe("برونو فيرنانديز");
  });

  it("returns null and logs at info when loader can't find the fixture", async () => {
    vi.mocked(loadFixture).mockResolvedValueOnce(null);
    const infoSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const detail = await getFixtureDetail("nonexistent-id", 2024);

    expect(detail).toBeNull();
    expect(
      infoSpy.mock.calls.some((args) =>
        String(args[0]).includes('"message":"fixture-detail.not_found"'),
      ),
    ).toBe(true);
  });

  it("derives the season from the fixture id's date when none is passed", async () => {
    vi.mocked(loadFixture).mockResolvedValueOnce(kFixture());
    // "2024-08-16-MUN-FUL" → Aug 2024 → 2024-25 season → 2024 (NOT the current
    // default 2025). This is what makes historical fixture pages resolve.
    await getFixtureDetail(FIXTURE_ID);
    expect(loadFixture).toHaveBeenCalledWith(FIXTURE_ID, 2024);
  });

  it("derives a May fixture into the prior season (Jan–Jul → year-1)", async () => {
    vi.mocked(loadFixture).mockResolvedValueOnce(null);
    await getFixtureDetail("2025-05-25-BOU-LEI");
    expect(loadFixture).toHaveBeenCalledWith("2025-05-25-BOU-LEI", 2024);
  });

  it("falls back to currentDataSeason() for an id with no parseable date", async () => {
    vi.mocked(loadFixture).mockResolvedValueOnce(null);
    await getFixtureDetail("not-a-dated-id");
    expect(loadFixture).toHaveBeenCalledWith("not-a-dated-id", currentDataSeason());
  });
});
