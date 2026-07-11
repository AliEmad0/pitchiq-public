import { describe, it, expect } from "vitest";
import { PlayerSchema } from "@/data/schemas";

const basePlayer = {
  id: 1001119,
  name: "Mohamed Salah",
  teamId: 14,
  teamName: "Liverpool",
  position: "Forward" as const,
  photo: "118748",
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

describe("PlayerSchema bio fields", () => {
  it("accepts a player without the new fields (existing files)", () => {
    expect(PlayerSchema.parse(basePlayer).birthDate).toBeUndefined();
  });

  it("accepts birthDate/birthYear/nationality/nationalityCode", () => {
    const p = PlayerSchema.parse({
      ...basePlayer,
      birthDate: "1992-06-15",
      birthYear: 1992,
      nationality: "Egypt",
      nationalityCode: "eg",
    });
    expect(p.birthDate).toBe("1992-06-15");
    expect(p.nationalityCode).toBe("eg");
  });

  it("accepts null bio fields", () => {
    const p = PlayerSchema.parse({
      ...basePlayer,
      birthDate: null,
      birthYear: null,
      nationality: null,
      nationalityCode: null,
    });
    expect(p.nationality).toBeNull();
  });

  it("accepts dateOfDeath (TASK-M40)", () => {
    const p = PlayerSchema.parse({ ...basePlayer, dateOfDeath: "2025-07-03" });
    expect(p.dateOfDeath).toBe("2025-07-03");
  });
});
