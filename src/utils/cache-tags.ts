// Single source of truth for Next.js cache-tag strings. Tags follow the
// `<domain>:<param>:<param>` convention; the exact strings are pinned by
// `tests/unit/cache-tags.test.ts` because changing them invalidates
// every entry in production.
//
// `PREMIER_LEAGUE_ID` lives here (not in `leagues/api.ts`) because the
// fetchers in features/* import these helpers, and the helpers need the
// constant — colocating breaks the would-be import cycle. `leagues/api.ts`
// re-exports the constant so existing imports continue to work.

export const PREMIER_LEAGUE_ID = 39 as const;

export type LeaderboardKind = "topscorers" | "topassists" | "topyellowcards" | "topredcards";

export function standingsTag(season: number): string {
  return `standings:${PREMIER_LEAGUE_ID}:${season}`;
}

export function leaderboardTag(kind: LeaderboardKind, season: number): string {
  return `leaderboards:${kind}:${season}`;
}

export function fixturesNextTag(season: number): string {
  return `fixtures:next:${PREMIER_LEAGUE_ID}:${season}`;
}

export function fixturesLastTag(season: number): string {
  return `fixtures:last:${PREMIER_LEAGUE_ID}:${season}`;
}

// Forward-defined for Phase 3 / Phase 4. Unused in this PR — they exist so
// the relevant tickets land their tags already centralized.
export function teamTag(id: number): string {
  return `team:${id}`;
}

export function teamsListTag(season: number): string {
  return `teams:${PREMIER_LEAGUE_ID}:${season}`;
}

export function teamStatsTag(season: number, id: number): string {
  return `team-stats:${season}:${id}`;
}

export function teamRecentFixturesTag(season: number, id: number): string {
  return `team-recent-fixtures:${season}:${id}`;
}

export function squadTag(teamId: number): string {
  return `squad:${teamId}`;
}

export function playerStatsTag(id: number, season: number): string {
  return `player-stats:${id}:${season}`;
}

export function fixtureDetailTag(id: number): string {
  return `fixture-detail:${id}`;
}

// `<RadarChart>` (TASK-407) normalises player values to [0, 1] against
// league-wide maxima for each axis. The maxes only drift over a season,
// so they cache for 24h — the tag exists for the rare case where a
// data correction (e.g. retroactive stat fix) needs an immediate bust.
export function metricMaxesTag(season: number): string {
  return `metric-maxes:${PREMIER_LEAGUE_ID}:${season}`;
}
