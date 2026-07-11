import "server-only";

import { getEntityNames, IDENTITY_NAMES, type EntityNames } from "@/features/i18n/entity-names";
import { loadClubLogos, loadFixtures } from "@/data/loaders";
import type { ClubLogosFile, Fixture as SnapshotFixture } from "@/data/schemas";
import type { Fixture } from "@/types/api";
import { fixturesLastTag, fixturesNextTag, PREMIER_LEAGUE_ID } from "@/utils/cache-tags";
import { clubLogoFromMap } from "@/utils/club-logo";
import { logger } from "@/utils/logger";
import { getSeasonState, seasonFromFixtureId, type SeasonState } from "@/utils/season";

// Fixture IDs are human-readable strings like "2024-08-16-MUN-FUL".
// `FixtureInfo.id` is typed as `number | string` (TASK-508) so we pass the
// string id straight through to consumers — `<Link href={`/fixtures/${id}`}>`
// stringifies it cleanly and `/fixtures/[id]/page.tsx` accepts the string.

// Synthesize the nested `Fixture` envelope from a flat snapshot fixture.
// Only the fields read by existing consumers are populated; everything else
// is set to `null` or a safe zero-value so TypeScript is satisfied without
// fabricating data we don't have.
//
// Consumers confirmed (grep of src/features/leagues/components/FixturesRail.tsx):
//   fx.fixture.id          → <Link href="/fixtures/{id}">
//   fx.fixture.date        → <KickoffLine>
//   fx.teams.home.name     → <TeamSide>
//   fx.teams.home.logo     → <TeamSide> (Image src)
//   fx.teams.home.winner   → dim logic (null = draw / not-played)
//   fx.teams.away.*        → same
//   fx.goals.home / .away  → <Scoreline>
//
// The teams-feature `<RecentFormStrip>` consumes the same set of fields
// (date, teams.*.{name,logo,winner}, goals.*) plus uses `fx.fixture.id`
// as a React key.
//
// `now` is passed in so callers (getNextFixtures / getRecentResults) can
// share a single `new Date().toISOString()` snapshot for consistent
// filtering and status synthesis within one render.
//
// **Exported for reuse:** `src/features/teams/fixtures.api.ts#getTeamRecentFixtures`
// imports this helper (TASK-506). The win/draw/loss derivation, fixture-id
// passthrough, and logo-URL rewrite stay in lockstep across dashboard rails and
// the team-profile recent-form strip.
// `clubLogos` (the committed `data/club-logos.json` map) lets each side render
// the era-correct crest for the fixture's season (TASK-M54); the season is
// derived from the fixture id. Omitted/null → the current crest (base file).
export function toApiFixture(
  f: SnapshotFixture,
  now: string,
  clubLogos: ClubLogosFile | null = null,
  names: EntityNames = IDENTITY_NAMES,
): Fixture {
  const fxSeason = seasonFromFixtureId(String(f.id)) ?? new Date(f.date).getFullYear();
  // A fixture is "played" if its scheduled date has passed, regardless of
  // whether the snapshot carries scores (the complete-season snapshot
  // has scores for every fixture). Upcoming fixtures (date > now) are "NS".
  const isPlayed = f.date <= now;

  // winner: true if team won, false if lost, null if draw or not played yet.
  const hasScores = f.homeScore !== null && f.awayScore !== null;
  const homeWinner =
    isPlayed && hasScores
      ? f.homeScore! > f.awayScore!
        ? true
        : f.homeScore! < f.awayScore!
          ? false
          : null
      : null;
  const awayWinner =
    isPlayed && hasScores
      ? f.awayScore! > f.homeScore!
        ? true
        : f.awayScore! < f.homeScore!
          ? false
          : null
      : null;

  return {
    fixture: {
      id: f.id,
      referee: names.referee(f.referee),
      timezone: "UTC",
      date: f.date,
      timestamp: Math.floor(new Date(f.date).getTime() / 1000),
      periods: { first: null, second: null },
      // TASK-1606 follow-up: localize the venue on `/ar` (the home stadium's
      // Arabic name, keyed by the home team's id — was raw Latin). `/en` →
      // identity. Referee (above) is already resolved, but its ar map is
      // intentionally empty (owner left the 153 abbreviated names source-form).
      venue: { id: null, name: names.venue(f.homeTeamId, f.venue) ?? f.venue, city: null },
      status: {
        long: isPlayed ? "Match Finished" : "Not Started",
        short: isPlayed ? "FT" : "NS",
        elapsed: null,
        extra: null,
      },
    },
    league: {
      id: PREMIER_LEAGUE_ID,
      name: "Premier League",
      country: "England",
      logo: "",
      flag: null,
      season: new Date(f.date).getFullYear(),
      round: "",
      standings: true,
    },
    teams: {
      home: {
        id: f.homeTeamId,
        name: names.team(f.homeTeamId, f.homeTeamName),
        logo: clubLogoFromMap(f.homeTeamId, fxSeason, clubLogos),
        winner: homeWinner,
      },
      away: {
        id: f.awayTeamId,
        name: names.team(f.awayTeamId, f.awayTeamName),
        logo: clubLogoFromMap(f.awayTeamId, fxSeason, clubLogos),
        winner: awayWinner,
      },
    },
    goals: {
      home: f.homeScore,
      away: f.awayScore,
    },
    score: {
      halftime: f.halfTime
        ? { home: f.halfTime.home, away: f.halfTime.away }
        : { home: null, away: null },
      fulltime: { home: f.homeScore, away: f.awayScore },
      extratime: { home: null, away: null },
      penalty: { home: null, away: null },
    },
  };
}

type GetFixturesArgs = {
  league?: number;
  season: number;
  count?: number;
};

// Next N upcoming fixtures, soonest first. Sourced from the committed
// JSON snapshot — no outbound HTTP call.
//
// **Season note:** a complete season (every fixture already played) returns
// `[]` — the dashboard rail renders the "No upcoming fixtures." empty state,
// which is correct. When a snapshot with upcoming fixtures is committed, this
// fetcher automatically serves them.
export async function getNextFixtures({
  league = PREMIER_LEAGUE_ID,
  season,
  count = 5,
}: GetFixturesArgs): Promise<Fixture[] | null> {
  void league; // accepted for signature compat; loader is PL-only

  const tag = fixturesNextTag(season);
  const snapshotFixtures = await loadFixtures(season);

  if (!snapshotFixtures) {
    logger.warn("fixtures.load_failed", { direction: "next", season, tag });
    return null;
  }

  const now = new Date().toISOString();
  const clubLogos = await loadClubLogos();
  const names = await getEntityNames();
  const upcoming = snapshotFixtures
    .filter((f) => f.date > now)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, count);

  return upcoming.map((f) => toApiFixture(f, now, clubLogos, names));
}

/**
 * Resolve the lifecycle state of a season's fixture set (TASK-608).
 *
 * The dashboard's `NextFixturesSection` checks this when `getNextFixtures`
 * returns an empty list — if the empty result is because the season is over
 * (vs. a load failure), it renders `<SeasonEndedCard>` instead of an empty
 * `<FixturesRail>`.
 *
 * Returns `"unknown"` when the loader fails so the consumer keeps the
 * existing empty-rail fallback rather than misleading the user with an
 * "ended" claim based on no data.
 *
 * Reuses the same `loadFixtures` call site as `getNextFixtures`; in a
 * Server Component render Next dedupes the fs read so calling both
 * sequentially in the same request is effectively free.
 */
export async function getSeasonStateForSeason(season: number): Promise<SeasonState> {
  const fixtures = await loadFixtures(season);
  if (!fixtures) return "unknown";
  return getSeasonState(fixtures.map((f) => f.date));
}

// Every fixture for a season, soonest first (TASK-M12 — the all-fixtures
// page). Unlike getNextFixtures / getRecentResults this applies no date filter
// or count cap: completed and upcoming matches are all returned, and the
// caller (the `/fixtures` page) renders each in the right mode via the
// synthesized `status.short` (FT vs NS). Reuses `toApiFixture` so the cards
// match the dashboard rails exactly.
export async function getSeasonFixtures({
  league = PREMIER_LEAGUE_ID,
  season,
}: {
  league?: number;
  season: number;
}): Promise<Fixture[] | null> {
  void league; // accepted for signature compat; loader is PL-only

  const snapshotFixtures = await loadFixtures(season);

  if (!snapshotFixtures) {
    logger.warn("fixtures.load_failed", { direction: "all", season });
    return null;
  }

  const now = new Date().toISOString();
  const clubLogos = await loadClubLogos();
  const names = await getEntityNames();
  return [...snapshotFixtures]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((f) => toApiFixture(f, now, clubLogos, names));
}

// Most recent N completed fixtures, latest first. Same approach as above.
export async function getRecentResults({
  league = PREMIER_LEAGUE_ID,
  season,
  count = 5,
}: GetFixturesArgs): Promise<Fixture[] | null> {
  void league; // accepted for signature compat; loader is PL-only

  const tag = fixturesLastTag(season);
  const snapshotFixtures = await loadFixtures(season);

  if (!snapshotFixtures) {
    logger.warn("fixtures.load_failed", { direction: "last", season, tag });
    return null;
  }

  const now = new Date().toISOString();
  const clubLogos = await loadClubLogos();
  const names = await getEntityNames();
  const completed = snapshotFixtures
    .filter((f) => f.date <= now && f.homeScore !== null && f.awayScore !== null)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, count);

  return completed.map((f) => toApiFixture(f, now, clubLogos, names));
}
