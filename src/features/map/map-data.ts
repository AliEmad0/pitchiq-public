import type { Standing } from "@/data/schemas";

// Pure helpers for the /map page (TASK-M27). No fs/network — the page passes
// in the already-loaded per-season standings.

export type PerSeasonStandings = { season: number; standings: Standing[] | null };

export type MapData = {
  /** season (start year) → ids of the clubs in that season's standings. */
  activeBySeason: Record<number, number[]>;
  /** teamId → display name, collected across all seasons (covers defunct clubs). */
  nameById: Record<number, string>;
};

export function buildMapData(perSeason: PerSeasonStandings[]): MapData {
  const activeBySeason: Record<number, number[]> = {};
  const nameById: Record<number, string> = {};
  for (const { season, standings } of perSeason) {
    if (!standings) continue;
    activeBySeason[season] = standings.map((s) => s.teamId);
    for (const s of standings) nameById[s.teamId] = s.teamName;
  }
  return { activeBySeason, nameById };
}

export function activeSetForSeason(
  activeBySeason: Record<number, number[]>,
  season: number,
): Set<number> {
  return new Set(activeBySeason[season] ?? []);
}

/**
 * teamId → the latest (highest) season the club appears in any standings. Used
 * so a click on a club that's dormant in the viewed season lands on a page that
 * has data (its most recent top-flight season) rather than an empty one.
 */
export function latestSeasonByClub(
  activeBySeason: Record<number, number[]>,
): Record<number, number> {
  const out: Record<number, number> = {};
  for (const [seasonStr, ids] of Object.entries(activeBySeason)) {
    const season = Number(seasonStr);
    for (const id of ids) {
      if (out[id] === undefined || season > out[id]) out[id] = season;
    }
  }
  return out;
}
