import "server-only";

import { getEntityNames } from "@/features/i18n/entity-names";
import { loadClubLogos, loadFixtures } from "@/data/loaders";
import { toApiFixture } from "@/features/leagues/fixtures.api";
import type { Fixture } from "@/types/api";
import { logger } from "@/utils/logger";

/**
 * Return the team's `last` most recent completed fixtures, newest-first,
 * sourced from the committed JSON snapshot.
 *
 * Filter by `homeTeamId === teamId || awayTeamId === teamId`, restrict to
 * fixtures with a kickoff at or before "now" AND with both scores present
 * (so in-progress fixtures don't pollute the form strip — a complete-season
 * snapshot has every score, but future seasons may carry
 * scheduled-but-not-yet-played rows), then sort by date desc and slice.
 *
 * `toApiFixture` is imported from `src/features/leagues/fixtures.api.ts` so
 * the win/draw/loss derivation, fixture-id hashing, and logo-URL rewrite
 * stay consistent between the dashboard rails and this strip. The fixture-
 * id hash inherits the known broken-link window TASK-508 will close.
 */
export async function getTeamRecentFixtures(
  season: number,
  teamId: number,
  last = 5,
): Promise<Fixture[] | null> {
  const all = await loadFixtures(season);
  if (!all) {
    logger.warn("team-recent-fixtures.load_failed", { teamId, season });
    return null;
  }

  const now = new Date().toISOString();
  const clubLogos = await loadClubLogos();
  const names = await getEntityNames();
  const completed = all
    .filter(
      (f) =>
        (f.homeTeamId === teamId || f.awayTeamId === teamId) &&
        f.date <= now &&
        f.homeScore !== null &&
        f.awayScore !== null,
    )
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, last);

  return completed.map((f) => toApiFixture(f, now, clubLogos, names));
}
