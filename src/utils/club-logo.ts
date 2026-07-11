// Season-accurate club crests (TASK-M54). A pure resolver picks the crest a
// club actually used in a given season. The CURRENT crest stays at
// `public/logos/<teamId>.png`; only HISTORICAL variants live in
// `data/club-logos.json` (per club, a list of `{since, until, file}` ranges,
// PL season start-years inclusive). Pure so it runs on the server (fetchers)
// AND the client (the /map slider re-resolves per season as you drag).

export type LogoVariant = { since: number; until: number; file: string };

/** Map shape of `data/club-logos.json`: teamId (string key) → historical ranges. */
export type ClubLogosMap = Record<string, LogoVariant[]>;

/**
 * The crest URL for `teamId` in `season`. If one of `variants`' ranges contains
 * the season, returns its `/logos/history/<file>`; otherwise the base
 * `/logos/<teamId>.png` (the current crest, used for any season past the last
 * range, for gaps, and for clubs with no historical data → zero regression).
 */
export function clubLogo(teamId: number, season: number, variants?: LogoVariant[]): string {
  if (variants) {
    for (const v of variants) {
      if (season >= v.since && season <= v.until) return `/logos/history/${v.file}`;
    }
  }
  return `/logos/${teamId}.png`;
}

/** Convenience: look the club up by string key in the loaded map, then resolve. */
export function clubLogoFromMap(
  teamId: number,
  season: number,
  map: ClubLogosMap | null | undefined,
): string {
  return clubLogo(teamId, season, map?.[String(teamId)]);
}
