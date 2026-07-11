import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/data/loaders", () => ({
  loadClubLogos: vi.fn(async () => null),
  loadPlayer: vi.fn(),
  loadCaptains: vi.fn(async () => null),
  captainIdFor: () => null,
}));
import { loadPlayer } from "@/data/loaders";
import { getPlayerProfile } from "@/features/players/api";

const salah = {
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

describe("getPlayerProfile bio", () => {
  beforeEach(() => vi.clearAllMocks());

  it("surfaces DOB, nationality, and a (current) age seed", async () => {
    (loadPlayer as ReturnType<typeof vi.fn>).mockResolvedValue(salah);
    const p = await getPlayerProfile(1001119, 2025);
    expect(p?.birthDate).toBe("1992-06-15");
    expect(p?.nationality).toBe("Egypt");
    expect(p?.nationalityCode).toBe("eg");
    expect(p?.dateOfDeath).toBeNull();
    expect(typeof p?.age).toBe("number"); // current age (refined live in the UI)
  });

  it("freezes age at death + surfaces dateOfDeath for a deceased player (TASK-M40)", async () => {
    (loadPlayer as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...salah,
      name: "Diogo Jota",
      birthDate: "1996-12-04",
      birthYear: 1996,
      dateOfDeath: "2025-07-03",
    });
    const p = await getPlayerProfile(1000396, 2024);
    expect(p?.dateOfDeath).toBe("2025-07-03");
    expect(p?.age).toBe(28); // frozen at death, deterministic
  });

  it("nulls bio + age when the source lacks them", async () => {
    (loadPlayer as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...salah,
      birthDate: undefined,
      birthYear: undefined,
      nationality: undefined,
      nationalityCode: undefined,
    });
    const p = await getPlayerProfile(1001119, 2025);
    expect(p?.age).toBeNull();
    expect(p?.nationality).toBeNull();
  });
});
