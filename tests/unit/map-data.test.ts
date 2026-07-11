import { describe, expect, it } from "vitest";

import type { Standing } from "@/data/schemas";
import { activeSetForSeason, buildMapData, latestSeasonByClub } from "@/features/map/map-data";

function standing(teamId: number, teamName: string): Standing {
  return {
    rank: 1,
    teamId,
    teamName,
    played: 38,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalsDiff: 0,
    points: 0,
    form: "",
  } as Standing;
}

describe("buildMapData", () => {
  it("maps each season to its standings team ids + collects names", () => {
    const { activeBySeason, nameById } = buildMapData([
      { season: 2024, standings: [standing(33, "Man Utd"), standing(40, "Liverpool")] },
      { season: 1996, standings: [standing(33, "Man Utd"), standing(67, "Blackburn")] },
      { season: 1999, standings: null }, // unsupported season → skipped
    ]);
    expect(activeBySeason[2024]).toEqual([33, 40]);
    expect(activeBySeason[1996]).toEqual([33, 67]);
    expect(activeBySeason[1999]).toBeUndefined();
    expect(nameById[67]).toBe("Blackburn");
  });

  it("activeSetForSeason returns a Set (O(1) membership), empty for unknown", () => {
    const map = { 2024: [33, 40] };
    expect(activeSetForSeason(map, 2024).has(33)).toBe(true);
    expect(activeSetForSeason(map, 2024).has(99)).toBe(false);
    expect(activeSetForSeason(map, 1066).size).toBe(0);
  });

  it("latestSeasonByClub maps each club to its most recent active season", () => {
    const map = { 2024: [33, 40], 1996: [33, 67], 2010: [67] };
    const latest = latestSeasonByClub(map);
    expect(latest[33]).toBe(2024); // active in 1996 and 2024 → newest wins
    expect(latest[40]).toBe(2024);
    expect(latest[67]).toBe(2010); // active in 1996 and 2010 → 2010
    expect(latest[99]).toBeUndefined();
  });
});
