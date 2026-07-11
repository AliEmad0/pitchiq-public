import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getPlayerSlim } from "@/features/players/api";
import { loadPlayer } from "@/data/loaders";
import type { Player as SnapshotP } from "@/data/schemas";
import { getEntityNames, makeEntityNames } from "@/features/i18n/entity-names";

vi.mock("@/data/loaders", () => ({
  loadClubLogos: vi.fn(async () => null),
  loadPlayer: vi.fn(),
  loadPlayers: vi.fn(),
}));

// Resolver defaults to identity (Latin); the /ar test overrides it once. (The
// loaders mock above replaces the whole module, so `getEntityNames("ar")` can't
// read the real ar maps here → mock the resolver directly.)
vi.mock("@/features/i18n/entity-names", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/i18n/entity-names")>();
  return { ...actual, getEntityNames: vi.fn(async () => actual.IDENTITY_NAMES) };
});

const PLAYER_ID = 1000376;

function snapshotP(overrides: Partial<SnapshotP> = {}): SnapshotP {
  return {
    id: 1000376,
    name: "Bruno Fernandes",
    teamId: 33,
    teamName: "Manchester Utd",
    position: "Midfielder",
    photo: null,
    metrics: {
      appearances: 32,
      goals: 18,
      assists: 11,
      passAccuracy: 84,
      keyPasses: 62,
      tackles: 28,
      interceptions: 14,
      duelsWon: 118,
      dribblesCompleted: 51,
      shotsOnTarget: 47,
      yellowCards: 6,
      redCards: 2,
    },
    ...overrides,
  };
}

describe("getPlayerSlim", () => {
  beforeEach(() => {
    vi.mocked(loadPlayer).mockReset();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the slim shape with synthesized team logo path", async () => {
    vi.mocked(loadPlayer).mockResolvedValueOnce(snapshotP());

    const result = await getPlayerSlim(PLAYER_ID, 2024);

    expect(result).toEqual({
      id: PLAYER_ID,
      name: "Bruno Fernandes",
      team: { id: 33, name: "Manchester Utd", logo: "/logos/33.png" },
      photo: "",
      // TASK-1513 slot-card enrichment. This mock carries no DOB/nationality,
      // so age + the bio fields resolve to null; position passes through.
      position: "Midfielder",
      age: null,
      birthDate: null,
      dateOfDeath: null,
      nationality: null,
      nationalityCode: null,
    });
  });

  it("enriches age + nationality when the snapshot row carries them (TASK-1513)", async () => {
    vi.mocked(loadPlayer).mockResolvedValueOnce(
      snapshotP({
        birthDate: "1994-09-08",
        dateOfDeath: null,
        nationality: "Portugal",
        nationalityCode: "pt",
      }),
    );

    const result = await getPlayerSlim(PLAYER_ID, 2024);

    expect(result?.position).toBe("Midfielder");
    expect(result?.nationality).toBe("Portugal");
    expect(result?.nationalityCode).toBe("pt");
    expect(result?.birthDate).toBe("1994-09-08");
    // Age is a live "until now" seed — just assert it's a plausible integer.
    expect(typeof result?.age).toBe("number");
    expect(result!.age!).toBeGreaterThan(25);
  });

  it("passes through snapshot photo as empty string when null", async () => {
    vi.mocked(loadPlayer).mockResolvedValueOnce(snapshotP({ photo: null }));
    const result = await getPlayerSlim(PLAYER_ID, 2024);
    expect(result?.photo).toBe("");
  });

  it("preserves a non-null snapshot photo URL", async () => {
    vi.mocked(loadPlayer).mockResolvedValueOnce(snapshotP({ photo: "https://example.test/p.png" }));
    const result = await getPlayerSlim(PLAYER_ID, 2024);
    expect(result?.photo).toBe("https://example.test/p.png");
  });

  it("returns null and logs at info when player id is unknown", async () => {
    vi.mocked(loadPlayer).mockResolvedValueOnce(null);
    const infoSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const result = await getPlayerSlim(999999, 2024);

    expect(result).toBeNull();
    expect(
      infoSpy.mock.calls.some((args) =>
        String(args[0]).includes('"message":"player-slim.not_found"'),
      ),
    ).toBe(true);
  });

  // TASK-1606 follow-up: the compare slot card was Latin — the slim path never
  // threaded the resolver. The route passes the locale via `?locale=`.
  it("localizes name / club / position / nationality on /ar", async () => {
    vi.mocked(loadPlayer).mockResolvedValueOnce(
      snapshotP({ nationality: "Portugal", nationalityCode: "pt" }),
    );
    vi.mocked(getEntityNames).mockResolvedValueOnce(
      makeEntityNames(
        {
          teams: { "33": "مانشستر يونايتد" },
          players: { "1000376": "برونو فيرنانديز" },
          positions: { Midfielder: "لاعب وسط" },
          nationalities: { pt: "البرتغال" },
          managers: {},
          venues: {},
          cities: {},
          referees: {},
        },
        "ar",
      ),
    );

    const result = await getPlayerSlim(PLAYER_ID, 2024, "ar");

    expect(result?.name).toBe("برونو فيرنانديز");
    expect(result?.team.name).toBe("مانشستر يونايتد");
    expect(result?.position).toBe("لاعب وسط");
    expect(result?.nationality).toBe("البرتغال");
    // The ISO code is unchanged (drives the flag), only the display name flips.
    expect(result?.nationalityCode).toBe("pt");
  });
});
