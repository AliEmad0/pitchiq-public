import type { PerSeasonStandings } from "./map-data";

// Pure region aggregates for the /map region modals (TASK-M27 follow-up).

type RegionedClub = { teamId: number; regionId: string };

/**
 * Tally PL titles per club and per region. The champion of a season is the
 * rank-1 row of its standings (already sorted). `clubs` maps each club to its
 * NUTS1 region so a champion's win also counts toward that region.
 */
export function championsByRegion<T extends RegionedClub>(
  perSeason: PerSeasonStandings[],
  clubs: T[],
): { titlesByClub: Record<number, number>; titlesByRegion: Record<string, number> } {
  const regionByClub = new Map(clubs.map((c) => [c.teamId, c.regionId]));
  const titlesByClub: Record<number, number> = {};
  const titlesByRegion: Record<string, number> = {};
  for (const { standings } of perSeason) {
    if (!standings || standings.length === 0) continue;
    const championId = standings[0].teamId;
    titlesByClub[championId] = (titlesByClub[championId] ?? 0) + 1;
    const region = regionByClub.get(championId);
    if (region) titlesByRegion[region] = (titlesByRegion[region] ?? 0) + 1;
  }
  return { titlesByClub, titlesByRegion };
}

export function clubsForRegion<T extends RegionedClub>(clubs: T[], regionId: string): T[] {
  return clubs.filter((c) => c.regionId === regionId);
}
