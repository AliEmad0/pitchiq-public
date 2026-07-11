import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getPlayerStats } from "@/features/players/api";
import { loadPlayer } from "@/data/loaders";
import type { Player as SnapshotP } from "@/data/schemas";

vi.mock("@/data/loaders", () => ({
  loadPlayer: vi.fn(),
  loadPlayers: vi.fn(),
}));

const PLAYER_ID = 1000376; // Bruno Fernandes — real snapshot id

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

describe("getPlayerStats", () => {
  beforeEach(() => {
    vi.mocked(loadPlayer).mockReset();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns { player, metrics } on the happy path", async () => {
    vi.mocked(loadPlayer).mockResolvedValueOnce(snapshotP());

    const result = await getPlayerStats(PLAYER_ID, 2024);

    expect(result).not.toBeNull();
    expect(result?.player.id).toBe(PLAYER_ID);
    expect(result?.player.name).toBe("Bruno Fernandes");
    expect(result?.metrics).toEqual({
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
    });
  });

  it("synthesizes wire Player fields with safe defaults", async () => {
    vi.mocked(loadPlayer).mockResolvedValueOnce(snapshotP());
    const result = await getPlayerStats(PLAYER_ID, 2024);

    expect(result?.player.firstname).toBe("");
    expect(result?.player.lastname).toBe("");
    expect(result?.player.age).toBe(0);
    expect(result?.player.nationality).toBe("");
    expect(result?.player.height).toBeNull();
    expect(result?.player.weight).toBeNull();
    expect(result?.player.injured).toBe(false);
    expect(result?.player.photo).toBe("");
  });

  it("returns null and logs at info when player id doesn't exist", async () => {
    vi.mocked(loadPlayer).mockResolvedValueOnce(null);
    const infoSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const result = await getPlayerStats(999999, 2024);

    expect(result).toBeNull();
    expect(
      infoSpy.mock.calls.some((args) =>
        String(args[0]).includes('"message":"player-stats.not_found"'),
      ),
    ).toBe(true);
  });

  it("passes through snapshot photo as empty string when null", async () => {
    vi.mocked(loadPlayer).mockResolvedValueOnce(snapshotP({ photo: null }));
    const result = await getPlayerStats(PLAYER_ID, 2024);
    expect(result?.player.photo).toBe("");
  });

  it("preserves a non-null snapshot photo URL", async () => {
    vi.mocked(loadPlayer).mockResolvedValueOnce(snapshotP({ photo: "https://example.test/p.png" }));
    const result = await getPlayerStats(PLAYER_ID, 2024);
    expect(result?.player.photo).toBe("https://example.test/p.png");
  });
});
