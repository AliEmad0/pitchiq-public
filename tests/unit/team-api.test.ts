// @vitest-environment node
// MSW + happy-dom fetch don't mix — use Node's native fetch.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  loadSquad,
  loadTeams,
  loadTeamStats,
  loadFixtures,
  loadClubMetadata,
} from "@/data/loaders";
import type { Fixture, Player as SnapshotP, Team as SnapshotT } from "@/data/schemas";
import { getEntityNames, makeEntityNames } from "@/features/i18n/entity-names";
import { getPLTeams, getSquad, getTeam, getTeamStats } from "@/features/teams/api";

vi.mock("@/data/loaders", () => ({
  loadClubLogos: vi.fn(async () => null),
  loadTeams: vi.fn(),
  loadSquad: vi.fn(),
  loadTeamStats: vi.fn(),
  loadFixtures: vi.fn(),
  loadCaptains: vi.fn(async () => null),
  loadClubMetadata: vi.fn(async () => null),
  captainIdFor: () => null,
}));

// Resolver defaults to identity (Latin); each /ar test overrides it once.
vi.mock("@/features/i18n/entity-names", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/i18n/entity-names")>();
  return { ...actual, getEntityNames: vi.fn(async () => actual.IDENTITY_NAMES) };
});

// Build an /ar resolver from a partial set of maps (the rest default empty).
function arNames(maps: Partial<Parameters<typeof makeEntityNames>[0]>) {
  return makeEntityNames(
    {
      teams: {},
      players: {},
      managers: {},
      venues: {},
      cities: {},
      referees: {},
      positions: {},
      nationalities: {},
      ...maps,
    },
    "ar",
  );
}

const TEAM_ID = 33;

function snapshotManU(overrides: Partial<SnapshotT> = {}): SnapshotT {
  return {
    id: 33,
    name: "Manchester United",
    code: "MUN",
    founded: 1878,
    venue: "Old Trafford",
    capacity: 74310,
    logo: "/logos/33.png",
    ...overrides,
  };
}

describe("getTeam", () => {
  beforeEach(() => {
    vi.mocked(loadTeams).mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the typed TeamDetail on the happy path", async () => {
    vi.mocked(loadTeams).mockResolvedValueOnce([snapshotManU()]);

    const result = await getTeam(TEAM_ID);

    expect(result).not.toBeNull();
    expect(result?.team.id).toBe(TEAM_ID);
    expect(result?.team.name).toBe("Manchester United");
    expect(result?.team.code).toBe("MUN");
    expect(result?.team.founded).toBe(1878);
    expect(result?.team.country).toBe("England");
    expect(result?.team.national).toBe(false);
    expect(result?.team.logo).toBe("/logos/33.png");
    expect(result?.venue.name).toBe("Old Trafford");
    expect(result?.venue.capacity).toBe(74310);
    expect(result?.venue.address).toBeNull();
    expect(result?.venue.city).toBeNull();
    expect(result?.venue.surface).toBeNull();
    expect(result?.venue.image).toBeNull();
  });

  it("fills venue.city + venue.image from the club-metadata map (TASK-M19)", async () => {
    vi.mocked(loadTeams).mockResolvedValueOnce([snapshotManU()]);
    vi.mocked(loadClubMetadata).mockResolvedValueOnce({
      "33": { city: "Manchester", stadiumImage: "https://commons/old-trafford.jpg", website: null },
    });

    const result = await getTeam(TEAM_ID);

    expect(result?.venue.city).toBe("Manchester");
    expect(result?.venue.image).toBe("https://commons/old-trafford.jpg");
    // snapshot-sourced fields are untouched.
    expect(result?.venue.name).toBe("Old Trafford");
    expect(result?.venue.capacity).toBe(74310);
  });

  it("leaves venue.city + venue.image null when the club-metadata map lacks the id", async () => {
    vi.mocked(loadTeams).mockResolvedValueOnce([snapshotManU()]);
    vi.mocked(loadClubMetadata).mockResolvedValueOnce({
      "99": { city: "Nowhere", stadiumImage: "https://x.jpg", website: null },
    });

    const result = await getTeam(TEAM_ID);

    expect(result?.venue.city).toBeNull();
    expect(result?.venue.image).toBeNull();
  });

  it("returns null and logs `info` (not `error`) when the team id is unknown", async () => {
    vi.mocked(loadTeams).mockResolvedValueOnce([snapshotManU()]); // dataset doesn't include 999999

    const infoSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await getTeam(999999);

    expect(result).toBeNull();
    expect(errorSpy).not.toHaveBeenCalled();
    expect(
      infoSpy.mock.calls.some((args) => String(args[0]).includes('"message":"team.not_found"')),
    ).toBe(true);
  });

  it("returns null and logs at warn when the loader file is missing", async () => {
    vi.mocked(loadTeams).mockResolvedValueOnce(null);

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = await getTeam(TEAM_ID);

    expect(result).toBeNull();
    expect(
      warnSpy.mock.calls.some((args) => String(args[0]).includes('"message":"team.load_failed"')),
    ).toBe(true);
  });
});

describe("getSquad", () => {
  beforeEach(() => {
    vi.mocked(loadSquad).mockReset();
  });

  function snapshotPlayer(overrides: Partial<SnapshotP> = {}): SnapshotP {
    return {
      id: 1000373,
      name: "André Onana",
      teamId: TEAM_ID,
      teamName: "Manchester United",
      position: "Goalkeeper",
      photo: null,
      metrics: {
        appearances: null,
        goals: null,
        assists: null,
        passAccuracy: null,
        keyPasses: null,
        tackles: null,
        interceptions: null,
        duelsWon: null,
        dribblesCompleted: null,
        shotsOnTarget: null,
        yellowCards: null,
        redCards: null,
      },
      ...overrides,
    };
  }

  it("maps snapshot players to SquadPlayer[] with position normalization", async () => {
    vi.mocked(loadSquad).mockResolvedValueOnce([
      snapshotPlayer(),
      snapshotPlayer({ id: 1000400, name: "Marcus Rashford", position: "Forward" }),
      snapshotPlayer({ id: 1000401, name: "Bruno Fernandes", position: "Midfielder" }),
      snapshotPlayer({ id: 1000402, name: "Lisandro Martínez", position: "Defender" }),
    ]);

    const result = await getSquad(TEAM_ID);

    expect(result).not.toBeNull();
    expect(result).toHaveLength(4);
    expect(result?.[0].position).toBe("Goalkeeper");
    expect(result?.[1].position).toBe("Attacker"); // "Forward" → "Attacker"
    expect(result?.[2].position).toBe("Midfielder");
    expect(result?.[3].position).toBe("Defender");
    expect(result?.[0].age).toBeNull(); // snapshot has no age
    expect(result?.[0].number).toBeNull(); // snapshot has no kit number
    expect(result?.[0].name).toBe("André Onana");
  });

  it("passes through photo as null when snapshot dataset has no image", async () => {
    vi.mocked(loadSquad).mockResolvedValueOnce([snapshotPlayer({ photo: null })]);
    const result = await getSquad(TEAM_ID);
    expect(result?.[0].photo).toBeNull();
  });

  it("returns an empty array (not null) when the team has zero stats-emitting players", async () => {
    vi.mocked(loadSquad).mockResolvedValueOnce([]);

    const infoSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const result = await getSquad(34); // Newcastle in current data

    expect(result).toEqual([]);
    expect(
      infoSpy.mock.calls.some((args) => String(args[0]).includes('"message":"squad.empty"')),
    ).toBe(true);
  });

  it("returns null and logs at warn when the loader file is missing", async () => {
    vi.mocked(loadSquad).mockResolvedValueOnce(null);

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = await getSquad(TEAM_ID);

    expect(result).toBeNull();
    expect(
      warnSpy.mock.calls.some((args) => String(args[0]).includes('"message":"squad.load_failed"')),
    ).toBe(true);
  });
});

describe("getTeamStats", () => {
  beforeEach(() => {
    vi.mocked(loadTeamStats).mockReset();
    vi.mocked(loadFixtures).mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

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

  it("synthesizes the goal totals from the standings loader; aggregates null when fixtures are absent", async () => {
    vi.mocked(loadTeamStats).mockResolvedValueOnce({
      played: 38,
      won: 11,
      drawn: 9,
      lost: 18,
      goalsFor: 44,
      goalsAgainst: 54,
    });
    vi.mocked(loadFixtures).mockResolvedValueOnce(null); // no fixtures → derived fields null

    const result = await getTeamStats(2024, TEAM_ID);

    expect(result).not.toBeNull();
    expect(result?.goals.for.total.total).toBe(44);
    expect(result?.goals.against.total.total).toBe(54);
    expect(result?.goals.for.total.home).toBeNull();
    expect(result?.goals.for.total.away).toBeNull();
    expect(result?.goals.against.total.home).toBeNull();
    expect(result?.goals.against.total.away).toBeNull();
    expect(result?.clean_sheet.total).toBeNull();
    expect(result?.failed_to_score.total).toBeNull();
    expect(result?.biggest.streak.wins).toBeNull();
    expect(result?.biggest.streak.draws).toBeNull();
    expect(result?.biggest.streak.loses).toBeNull();
    expect(result?.longestUnbeaten).toBeNull();
    expect(result?.perGame?.shots).toBeNull();
    expect(result?.cards?.yellow).toBeNull();
    expect(result?.lineups).toEqual([]);
  });

  it("derives clean sheets, streaks, per-game + cards from the season fixtures (TASK-M17)", async () => {
    vi.mocked(loadTeamStats).mockResolvedValueOnce({
      played: 3,
      won: 2,
      drawn: 1,
      lost: 0,
      goalsFor: 6,
      goalsAgainst: 1,
    });
    const stat = {
      shots: 10,
      shotsOnTarget: 5,
      corners: 4,
      fouls: 8,
      yellowCards: 2,
      redCards: 0,
    };
    vi.mocked(loadFixtures).mockResolvedValueOnce([
      // TEAM 33 home, 3-0 → win + clean sheet
      fx({
        id: "a",
        date: "2024-08-01",
        homeTeamId: TEAM_ID,
        awayTeamId: 2,
        homeScore: 3,
        awayScore: 0,
        teamStats: { home: stat, away: stat },
      }),
      // TEAM away, 0-0 → draw + clean sheet
      fx({
        id: "b",
        date: "2024-08-08",
        homeTeamId: 3,
        awayTeamId: TEAM_ID,
        homeScore: 0,
        awayScore: 0,
        teamStats: { home: stat, away: stat },
      }),
      // TEAM home, 3-1 → win
      fx({
        id: "c",
        date: "2024-08-15",
        homeTeamId: TEAM_ID,
        awayTeamId: 4,
        homeScore: 3,
        awayScore: 1,
        teamStats: { home: stat, away: stat },
      }),
    ]);

    const result = await getTeamStats(2024, TEAM_ID);

    expect(result?.clean_sheet.total).toBe(2); // 3-0 and 0-0
    expect(result?.failed_to_score.total).toBe(1); // the 0-0 draw
    expect(result?.biggest.streak.wins).toBe(1); // W, D, W → max run of 1
    expect(result?.longestUnbeaten).toBe(3); // unbeaten all three
    expect(result?.perGame?.shots).toBe(10); // every match had 10 → avg 10
    expect(result?.perGame?.corners).toBe(4);
    expect(result?.cards?.yellow).toBe(6); // 2 per match × 3
  });

  it("returns null and logs at warn when the loader returns null", async () => {
    vi.mocked(loadTeamStats).mockResolvedValueOnce(null);

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = await getTeamStats(2024, TEAM_ID);

    expect(result).toBeNull();
    expect(
      warnSpy.mock.calls.some((args) =>
        String(args[0]).includes('"message":"team-stats.load_failed"'),
      ),
    ).toBe(true);
  });
});

describe("getPLTeams", () => {
  beforeEach(() => {
    vi.mocked(loadTeams).mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the league/season team list on the happy path", async () => {
    vi.mocked(loadTeams).mockResolvedValueOnce([
      snapshotManU(),
      snapshotManU({ id: 50, name: "Manchester City", code: "MCI", venue: "Etihad Stadium" }),
      snapshotManU({ id: 40, name: "Liverpool", code: "LIV", venue: "Anfield" }),
    ]);

    const teams = await getPLTeams(2024);

    expect(teams).not.toBeNull();
    expect(teams).toHaveLength(3);
    expect(teams?.[0].team.id).toBe(33);
    expect(teams?.[1].team.name).toBe("Manchester City");
    expect(teams?.[2].team.code).toBe("LIV");
  });

  it("returns an empty array when the dataset has no teams for the season", async () => {
    vi.mocked(loadTeams).mockResolvedValueOnce([]);
    const teams = await getPLTeams(2024);
    expect(teams).toEqual([]);
  });

  it("returns null and logs at warn when the loader file is missing", async () => {
    vi.mocked(loadTeams).mockResolvedValueOnce(null);

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const teams = await getPLTeams(2025); // no data file yet

    expect(teams).toBeNull();
    expect(
      warnSpy.mock.calls.some((args) =>
        String(args[0]).includes('"message":"teams-list.load_failed"'),
      ),
    ).toBe(true);
  });

  // TASK-1606 follow-up: the /teams index never threaded the resolver, so club
  // names read Latin on /ar despite the detail page being Arabic.
  it("localizes the club name on /ar", async () => {
    vi.mocked(loadTeams).mockResolvedValueOnce([snapshotManU()]);
    vi.mocked(getEntityNames).mockResolvedValueOnce(
      arNames({ teams: { "33": "مانشستر يونايتد" } }),
    );

    const teams = await getPLTeams(2024);

    expect(teams?.[0].team.name).toBe("مانشستر يونايتد");
  });
});

describe("getTeam — Arabic entity names on /ar (TASK-1606)", () => {
  beforeEach(() => vi.mocked(loadTeams).mockReset());
  afterEach(() => vi.restoreAllMocks());

  it("localizes the club name, venue, city, and country", async () => {
    vi.mocked(loadTeams).mockResolvedValueOnce([snapshotManU()]);
    vi.mocked(loadClubMetadata).mockResolvedValueOnce({
      "33": { city: "Manchester", stadiumImage: null, website: null },
    });
    vi.mocked(getEntityNames).mockResolvedValueOnce(
      arNames({
        teams: { "33": "مانشستر يونايتد" },
        venues: { "33": "أولد ترافورد" },
        cities: { "33": "مانشستر" },
        nationalities: { "gb-eng": "إنجلترا" },
      }),
    );

    const result = await getTeam(33);

    expect(result?.team.name).toBe("مانشستر يونايتد");
    expect(result?.team.country).toBe("إنجلترا");
    expect(result?.venue.name).toBe("أولد ترافورد");
    expect(result?.venue.city).toBe("مانشستر");
  });
});
