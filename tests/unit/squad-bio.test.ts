import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/data/loaders", () => ({
  loadSquad: vi.fn(),
  loadTeams: vi.fn(),
  loadTeamStats: vi.fn(),
  loadCaptains: vi.fn(async () => null),
  captainIdFor: () => null,
}));
import { loadSquad } from "@/data/loaders";
import { getSquad } from "@/features/teams/api";

const player = {
  id: 1001119,
  name: "Mohamed Salah",
  teamId: 14,
  teamName: "Liverpool",
  position: "Forward",
  photo: "118748",
  birthDate: "1992-06-15",
  birthYear: 1992,
  nationality: "Egypt",
  nationalityCode: "eg",
  metrics: {
    appearances: 38,
    goals: 29,
    assists: 18,
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
};

describe("getSquad bio", () => {
  beforeEach(() => vi.clearAllMocks());

  it("seeds a (current) age + carries nationality/birthDate, maps Forward→Attacker", async () => {
    (loadSquad as ReturnType<typeof vi.fn>).mockResolvedValue([player]);
    const squad = await getSquad(14, 2024);
    expect(typeof squad?.[0].age).toBe("number"); // current age (refined live in the UI)
    expect(squad?.[0].birthDate).toBe("1992-06-15");
    expect(squad?.[0].dateOfDeath).toBeNull();
    expect(squad?.[0].nationality).toBe("Egypt");
    expect(squad?.[0].nationalityCode).toBe("eg");
    expect(squad?.[0].position).toBe("Attacker");
  });

  it("freezes age at death + carries dateOfDeath (TASK-M40)", async () => {
    (loadSquad as ReturnType<typeof vi.fn>).mockResolvedValue([
      { ...player, birthDate: "1996-12-04", birthYear: 1996, dateOfDeath: "2025-07-03" },
    ]);
    const squad = await getSquad(14, 2024);
    expect(squad?.[0].dateOfDeath).toBe("2025-07-03");
    expect(squad?.[0].age).toBe(28); // frozen at death
  });

  it("age null when no birth info", async () => {
    (loadSquad as ReturnType<typeof vi.fn>).mockResolvedValue([
      { ...player, birthDate: undefined, birthYear: undefined, nationalityCode: undefined },
    ]);
    const squad = await getSquad(14, 2024);
    expect(squad?.[0].age).toBeNull();
    expect(squad?.[0].nationalityCode).toBeNull();
  });
});
