import { describe, expect, it } from "vitest";

import type { Standing } from "@/data/schemas";
import { championsByRegion, clubsForRegion } from "@/features/map/region-data";

function champ(teamId: number): Standing[] {
  return [
    {
      rank: 1,
      teamId,
      teamName: "X",
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalsDiff: 0,
      points: 0,
      form: "",
    } as Standing,
  ];
}
const clubs = [
  { teamId: 33, regionId: "UKD" },
  { teamId: 50, regionId: "UKD" },
  { teamId: 42, regionId: "UKI" },
];

describe("championsByRegion", () => {
  it("tallies titles per club and per region from the rank-1 rows", () => {
    const { titlesByClub, titlesByRegion } = championsByRegion(
      [
        { season: 2023, standings: champ(33) },
        { season: 2024, standings: champ(50) },
        { season: 2025, standings: champ(33) },
        { season: 1999, standings: null }, // no data → skipped
      ],
      clubs,
    );
    expect(titlesByClub[33]).toBe(2);
    expect(titlesByClub[50]).toBe(1);
    expect(titlesByRegion["UKD"]).toBe(3); // 33 + 50 both North West
    expect(titlesByRegion["UKI"]).toBeUndefined();
  });
});

describe("clubsForRegion", () => {
  it("filters clubs to a region id", () => {
    expect(clubsForRegion(clubs, "UKD").map((c) => c.teamId)).toEqual([33, 50]);
    expect(clubsForRegion(clubs, "UKZ")).toEqual([]);
  });
});
