import "server-only";

import { getEntityNames } from "@/features/i18n/entity-names";
import { loadClubLogos, loadFixtures, loadStandings } from "@/data/loaders";
import type { Fixture } from "@/types/api";

import { classicMatches, type ClassicBadge } from "./classic-matches";
import { toApiFixture } from "./fixtures.api";

// TASK-M14 — server fetcher behind the dashboard's "Classic Matches" rail.
// Loads the committed fixtures + standings, ranks them with the pure
// `classicMatches` helper, and reshapes each pick's fixture into the
// wire shape so it renders through the shared <FixtureCard>.

export type ClassicMatchView = {
  fixture: Fixture;
  /** Contextual catalyst badge descriptor (message key + params); the rail
   * resolves it to a localized label at render time (TASK-1604). */
  badge: ClassicBadge;
};

export async function getClassicMatches(
  season: number,
  limit = 6,
): Promise<ClassicMatchView[] | null> {
  const [fixtures, standings] = await Promise.all([loadFixtures(season), loadStandings(season)]);
  if (!fixtures || !standings) return null;

  const now = new Date().toISOString();
  const clubLogos = await loadClubLogos();
  const names = await getEntityNames();
  return classicMatches(fixtures, standings, { limit }).map((m) => ({
    fixture: toApiFixture(m.fixture, now, clubLogos, names),
    badge: m.badge,
  }));
}
