import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { searchPlayers } from "@/features/players/api";
import { loadPlayers } from "@/data/loaders";
import type { Player as SnapshotP } from "@/data/schemas";
import { getEntityNames, makeEntityNames } from "@/features/i18n/entity-names";

vi.mock("@/data/loaders", () => ({
  loadClubLogos: vi.fn(async () => null),
  loadPlayer: vi.fn(),
  loadPlayers: vi.fn(),
}));

// Resolver defaults to identity; the /ar test overrides it once (the loaders
// mock replaces the whole module, so the real ar maps aren't reachable here).
vi.mock("@/features/i18n/entity-names", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/i18n/entity-names")>();
  return { ...actual, getEntityNames: vi.fn(async () => actual.IDENTITY_NAMES) };
});

function snapshotP(id: number, name: string, teamId = 33, teamName = "Manchester Utd"): SnapshotP {
  return {
    id,
    name,
    teamId,
    teamName,
    position: "Midfielder",
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
  };
}

describe("searchPlayers", () => {
  beforeEach(() => {
    vi.mocked(loadPlayers).mockReset();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns hits matching the query substring, case-insensitive", async () => {
    vi.mocked(loadPlayers).mockResolvedValueOnce([
      snapshotP(1, "Bruno Fernandes"),
      snapshotP(2, "Casemiro"),
      snapshotP(3, "BRUNO Guimarães", 34, "Newcastle United"),
      snapshotP(4, "Marcus Rashford"),
    ]);

    const hits = await searchPlayers("bruno", 2024);

    expect(hits).toHaveLength(2);
    expect(hits?.map((h) => h.name)).toEqual(["Bruno Fernandes", "BRUNO Guimarães"]);
    expect(hits?.[1].team).toEqual({
      id: 34,
      name: "Newcastle United",
      logo: "/logos/34.png",
    });
  });

  it("returns an empty array when no name matches", async () => {
    vi.mocked(loadPlayers).mockResolvedValueOnce([snapshotP(1, "Bruno Fernandes")]);
    const hits = await searchPlayers("xyz", 2024);
    expect(hits).toEqual([]);
  });

  it("preserves snapshot iteration order", async () => {
    vi.mocked(loadPlayers).mockResolvedValueOnce([
      snapshotP(44, "Marcus Rashford", 66, "Aston Villa"),
      snapshotP(390, "Marcus Rashford", 33, "Manchester Utd"),
    ]);
    const hits = await searchPlayers("Rashford", 2024);
    expect(hits?.map((h) => h.id)).toEqual([44, 390]);
  });

  it("synthesizes /logos/<teamId>.png and empty-string photo", async () => {
    vi.mocked(loadPlayers).mockResolvedValueOnce([
      snapshotP(1, "Bruno Fernandes", 33, "Manchester Utd"),
    ]);
    const hits = await searchPlayers("Bruno", 2024);
    expect(hits?.[0].team.logo).toBe("/logos/33.png");
    expect(hits?.[0].photo).toBe("");
  });

  it("returns null and logs at warn when loader fails", async () => {
    vi.mocked(loadPlayers).mockResolvedValueOnce(null);
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const hits = await searchPlayers("Bruno", 2024);

    expect(hits).toBeNull();
    expect(
      warnSpy.mock.calls.some((args) =>
        String(args[0]).includes('"message":"players-search.load_failed"'),
      ),
    ).toBe(true);
  });

  // TASK-1606 follow-up: season-scoped hits now localize name + club on /ar.
  it("localizes hit name + club when locale is ar", async () => {
    vi.mocked(loadPlayers).mockResolvedValueOnce([snapshotP(1, "Bruno Fernandes")]);
    vi.mocked(getEntityNames).mockResolvedValueOnce(
      makeEntityNames(
        {
          teams: { "33": "مانشستر يونايتد" },
          players: { "1": "برونو فيرنانديز" },
          managers: {},
          venues: {},
          cities: {},
          referees: {},
          positions: {},
          nationalities: {},
        },
        "ar",
      ),
    );

    const hits = await searchPlayers("bruno", 2024, "ar");

    expect(hits?.[0].name).toBe("برونو فيرنانديز");
    expect(hits?.[0].team.name).toBe("مانشستر يونايتد");
  });
});
