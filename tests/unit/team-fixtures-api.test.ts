import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getTeamRecentFixtures } from "@/features/teams/fixtures.api";
import { loadFixtures } from "@/data/loaders";
import type { Fixture as SnapshotFixture } from "@/data/schemas";

vi.mock("@/data/loaders", () => ({
  loadClubLogos: vi.fn(async () => null),
  loadFixtures: vi.fn(),
}));

const TEAM_ID = 33;

function kFixture(
  id: string,
  date: string,
  overrides: Partial<SnapshotFixture> = {},
): SnapshotFixture {
  return {
    id,
    date,
    homeTeamId: TEAM_ID,
    awayTeamId: 50,
    homeTeamName: "Manchester United",
    awayTeamName: "Manchester City",
    homeScore: 2,
    awayScore: 1,
    venue: "Old Trafford",
    teamStats: null,
    halfTime: null,
    referee: null,
    ...overrides,
  };
}

describe("getTeamRecentFixtures", () => {
  beforeEach(() => {
    vi.mocked(loadFixtures).mockReset();
    // Pin "now" so fixtures with future dates can be tested deterministically.
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-06-01T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("returns the team's last N completed fixtures, newest-first", async () => {
    vi.mocked(loadFixtures).mockResolvedValueOnce([
      kFixture("g1", "2024-09-01T15:00:00Z"),
      kFixture("g2", "2024-10-01T15:00:00Z"),
      kFixture("g3", "2024-11-01T15:00:00Z"),
      kFixture("g4", "2024-12-01T15:00:00Z"),
      kFixture("g5", "2025-01-01T15:00:00Z"),
      kFixture("g6", "2025-02-01T15:00:00Z"),
    ]);

    const result = await getTeamRecentFixtures(2024, TEAM_ID, 5);

    expect(result).not.toBeNull();
    expect(result).toHaveLength(5);
    // newest first
    expect(result?.[0].fixture.date).toBe("2025-02-01T15:00:00Z");
    expect(result?.[4].fixture.date).toBe("2024-10-01T15:00:00Z");
  });

  it("includes fixtures where the team plays away", async () => {
    vi.mocked(loadFixtures).mockResolvedValueOnce([
      kFixture("away1", "2024-09-01T15:00:00Z", {
        homeTeamId: 40, // Liverpool
        awayTeamId: TEAM_ID,
        homeTeamName: "Liverpool",
        awayTeamName: "Manchester United",
      }),
    ]);

    const result = await getTeamRecentFixtures(2024, TEAM_ID);
    expect(result).toHaveLength(1);
    expect(result?.[0].teams.away.id).toBe(TEAM_ID);
  });

  it("excludes fixtures not involving the team", async () => {
    vi.mocked(loadFixtures).mockResolvedValueOnce([
      kFixture("not-mu", "2024-09-01T15:00:00Z", {
        homeTeamId: 40,
        awayTeamId: 42,
        homeTeamName: "Liverpool",
        awayTeamName: "Arsenal",
      }),
    ]);

    const result = await getTeamRecentFixtures(2024, TEAM_ID);
    expect(result).toEqual([]);
  });

  it("excludes fixtures dated in the future relative to 'now'", async () => {
    vi.mocked(loadFixtures).mockResolvedValueOnce([
      kFixture("past", "2024-09-01T15:00:00Z"),
      kFixture("future", "2025-12-01T15:00:00Z"),
    ]);
    const result = await getTeamRecentFixtures(2024, TEAM_ID);
    expect(result).toHaveLength(1);
    expect(result?.[0].fixture.date).toBe("2024-09-01T15:00:00Z");
  });

  it("excludes fixtures with null scores (not yet played)", async () => {
    vi.mocked(loadFixtures).mockResolvedValueOnce([
      kFixture("played", "2024-09-01T15:00:00Z"),
      kFixture("unplayed", "2024-09-08T15:00:00Z", { homeScore: null, awayScore: null }),
    ]);
    const result = await getTeamRecentFixtures(2024, TEAM_ID);
    expect(result).toHaveLength(1);
  });

  it("returns null and logs at warn when the loader file is missing", async () => {
    vi.mocked(loadFixtures).mockResolvedValueOnce(null);

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = await getTeamRecentFixtures(2024, TEAM_ID);

    expect(result).toBeNull();
    expect(
      warnSpy.mock.calls.some((args) =>
        String(args[0]).includes('"message":"team-recent-fixtures.load_failed"'),
      ),
    ).toBe(true);
  });

  it("respects a custom `last` count", async () => {
    vi.mocked(loadFixtures).mockResolvedValueOnce(
      Array.from({ length: 12 }, (_, i) => kFixture(`g${i}`, `2024-10-${10 + i}T15:00:00Z`)),
    );
    const result = await getTeamRecentFixtures(2024, TEAM_ID, 3);
    expect(result).toHaveLength(3);
  });

  it("defaults last to 5", async () => {
    vi.mocked(loadFixtures).mockResolvedValueOnce(
      Array.from({ length: 12 }, (_, i) => kFixture(`g${i}`, `2024-10-${10 + i}T15:00:00Z`)),
    );
    const result = await getTeamRecentFixtures(2024, TEAM_ID);
    expect(result).toHaveLength(5);
  });
});
