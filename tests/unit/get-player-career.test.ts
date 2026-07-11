import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/data/loaders", () => ({
  loadPlayer: vi.fn(),
  findPlayerSeasons: vi.fn(),
  // unused-but-imported by api.ts:
  loadPlayers: vi.fn(),
  loadCaptains: vi.fn(),
  captainIdFor: vi.fn(),
}));

import { findPlayerSeasons, loadPlayer } from "@/data/loaders";
import { getEntityNames, makeEntityNames } from "@/features/i18n/entity-names";
import { getPlayerCareer } from "@/features/players/api";

// Default identity; the /ar test overrides once. `resetAllMocks` in beforeEach
// wipes the impl → `getEntityNames()` returns undefined → `toApiPlayer`'s
// `names = IDENTITY_NAMES` default kicks in, so English stays Latin.
vi.mock("@/features/i18n/entity-names", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/i18n/entity-names")>();
  return { ...actual, getEntityNames: vi.fn(async () => actual.IDENTITY_NAMES) };
});

function snapshotRow(id: number, season: number, over: Record<string, unknown> = {}) {
  return {
    id,
    name: "Thierry Henry",
    teamId: 3,
    teamName: "Arsenal",
    position: "Forward",
    photo: "1619",
    metrics: {
      appearances: 30,
      goals: 20,
      assists: 5,
      passAccuracy: null,
      keyPasses: null,
      tackles: null,
      interceptions: null,
      duelsWon: null,
      dribblesCompleted: null,
      shotsOnTarget: null,
      yellowCards: 1,
      redCards: 0,
    },
    ...over,
  };
}

beforeEach(() => vi.resetAllMocks());

describe("getPlayerCareer", () => {
  it("aggregates counting stats across the player's seasons and reports the span", async () => {
    vi.mocked(findPlayerSeasons).mockResolvedValue({
      name: "Thierry Henry",
      teamId: 3,
      latest: snapshotRow(1003061, 2006) as never,
      seasons: [2006, 2003], // newest-first
    });
    vi.mocked(loadPlayer).mockImplementation(
      async (_id, season) => snapshotRow(1003061, season as number) as never,
    );

    const result = await getPlayerCareer(1003061);
    expect(result).not.toBeNull();
    expect(result!.metrics.goals).toBe(40);
    expect(result!.metrics.appearances).toBe(60);
    expect(result!.player.name).toBe("Thierry Henry");
    expect(result!.span).toEqual({ from: 2003, to: 2006 });
  });

  it("returns null for a player in no committed season", async () => {
    vi.mocked(findPlayerSeasons).mockResolvedValue(null);
    expect(await getPlayerCareer(999999)).toBeNull();
  });

  // TASK-1606 follow-up: the compare "All seasons" slot was Latin — this path
  // (via `toApiPlayer(info.latest)`) never threaded the resolver.
  it("localizes the display name on /ar", async () => {
    vi.mocked(findPlayerSeasons).mockResolvedValue({
      name: "Thierry Henry",
      teamId: 3,
      latest: snapshotRow(1003061, 2006) as never,
      seasons: [2006, 2003],
    });
    vi.mocked(loadPlayer).mockImplementation(
      async (_id, season) => snapshotRow(1003061, season as number) as never,
    );
    vi.mocked(getEntityNames).mockResolvedValueOnce(
      makeEntityNames(
        {
          players: { "1003061": "تييري هنري" },
          teams: {},
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

    const result = await getPlayerCareer(1003061);
    expect(result!.player.name).toBe("تييري هنري");
  });
});
