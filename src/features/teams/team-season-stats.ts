import type { Fixture } from "@/data/schemas";

/**
 * Season-aggregate team statistics derived from a season's fixtures (TASK-M17).
 *
 * Results-only fields (clean sheets, failed-to-score, streaks) are available for
 * every season. Per-game averages + card totals come from per-match `teamStats`,
 * which only exists from 2000-01 onward — when no completed match carries
 * `teamStats` they are `null` so the tiles render "—".
 */
export type TeamSeasonAggregate = {
  cleanSheets: number;
  failedToScore: number;
  longestWinStreak: number;
  longestLosingStreak: number;
  longestUnbeaten: number;
  avgShots: number | null;
  avgShotsOnTarget: number | null;
  avgCorners: number | null;
  avgFouls: number | null;
  yellowCards: number | null;
  redCards: number | null;
};

/**
 * Compute a team's season aggregates from the committed fixtures.
 *
 * Only completed matches (both scores non-null) count, processed in chronological
 * order (date asc, fixture-id tiebreak — same ordering as `synthesizeForm`). Per-
 * game stats read the team's own side of `teamStats` (home vs away). Pure: no I/O,
 * so it's unit-testable and reusable across seasons.
 */
export function aggregateTeamSeasonStats(fixtures: Fixture[], teamId: number): TeamSeasonAggregate {
  const played = fixtures
    .filter(
      (f) =>
        (f.homeTeamId === teamId || f.awayTeamId === teamId) &&
        f.homeScore !== null &&
        f.awayScore !== null,
    )
    .sort((a, b) => (a.date === b.date ? a.id.localeCompare(b.id) : a.date.localeCompare(b.date)));

  let cleanSheets = 0;
  let failedToScore = 0;
  let winRun = 0;
  let loseRun = 0;
  let unbeatenRun = 0;
  let longestWinStreak = 0;
  let longestLosingStreak = 0;
  let longestUnbeaten = 0;

  // Per-game accumulators — only over completed matches that carry teamStats.
  let withStats = 0;
  let shots = 0;
  let shotsOnTarget = 0;
  let corners = 0;
  let fouls = 0;
  let yellow = 0;
  let red = 0;

  for (const f of played) {
    const isHome = f.homeTeamId === teamId;
    const own = (isHome ? f.homeScore : f.awayScore) as number;
    const opp = (isHome ? f.awayScore : f.homeScore) as number;

    if (opp === 0) cleanSheets++;
    if (own === 0) failedToScore++;

    if (own > opp) {
      winRun++;
      unbeatenRun++;
      loseRun = 0;
    } else if (own < opp) {
      loseRun++;
      winRun = 0;
      unbeatenRun = 0;
    } else {
      unbeatenRun++;
      winRun = 0;
      loseRun = 0;
    }
    longestWinStreak = Math.max(longestWinStreak, winRun);
    longestLosingStreak = Math.max(longestLosingStreak, loseRun);
    longestUnbeaten = Math.max(longestUnbeaten, unbeatenRun);

    if (f.teamStats) {
      const s = isHome ? f.teamStats.home : f.teamStats.away;
      withStats++;
      shots += s.shots;
      shotsOnTarget += s.shotsOnTarget;
      corners += s.corners;
      fouls += s.fouls;
      yellow += s.yellowCards;
      red += s.redCards;
    }
  }

  const avg = (sum: number): number | null =>
    withStats === 0 ? null : Math.round((sum / withStats) * 10) / 10;

  return {
    cleanSheets,
    failedToScore,
    longestWinStreak,
    longestLosingStreak,
    longestUnbeaten,
    avgShots: avg(shots),
    avgShotsOnTarget: avg(shotsOnTarget),
    avgCorners: avg(corners),
    avgFouls: avg(fouls),
    yellowCards: withStats === 0 ? null : yellow,
    redCards: withStats === 0 ? null : red,
  };
}
