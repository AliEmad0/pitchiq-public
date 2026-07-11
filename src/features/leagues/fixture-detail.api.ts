import "server-only";

import { getEntityNames, type EntityNames } from "@/features/i18n/entity-names";
import {
  loadClubLogos,
  loadEvents,
  loadFixture,
  loadFixtureExtras,
  loadLineup,
  loadManagers,
  loadPlayers,
  loadTeamColors,
} from "@/data/loaders";
import { buildNameResolver } from "@/features/leagues/fixture-links";
import type { FixtureLineups, MatchEventRaw, TeamColorsFile } from "@/data/schemas";
import { toApiFixture } from "@/features/leagues/fixtures.api";
import type {
  FixtureDetail,
  FixtureEvent,
  FixtureLineup,
  FixtureStatBlock,
  FixtureTeam,
} from "@/types/api";
import { resolveKit } from "@/utils/kit-color";
import { logger } from "@/utils/logger";
import { currentDataSeason, seasonFromFixtureId } from "@/utils/season";

/**
 * Return the full `FixtureDetail` envelope for one match, sourced from the
 * committed JSON snapshot.
 *
 * The fixture header + team-level match stats come from the committed
 * snapshot; starting-XI lineups + minute-by-minute events come from the
 * committed `data/lineups-*.json` / `events-*.json` (covered
 * 2010-11 → 2025-26). Fixtures without lineup/event coverage return empty
 * `lineups`/`events`; the `/fixtures/[id]` page then renders the
 * `<LineupUnavailable>` / `<EventsUnavailable>` cards.
 *
 * Season is derived from the fixture id's date (`"YYYY-MM-DD-..."`, Aug–May →
 * start year) so a fixture page for ANY season resolves — not just the current
 * one. Pass `season` explicitly to override.
 */
export async function getFixtureDetail(
  id: string,
  // Default the season from the fixture id's date (Aug–May → start year) so
  // historical fixture pages resolve instead of 404ing against the current
  // season. Falls back to the current season if the id has no parseable date.
  season: number = seasonFromFixtureId(id) ?? currentDataSeason(),
): Promise<FixtureDetail | null> {
  const fixture = await loadFixture(id, season);
  if (!fixture) {
    logger.info("fixture-detail.not_found", { id, season });
    return null;
  }

  const now = new Date().toISOString();
  const names = await getEntityNames();
  const apiFixture = toApiFixture(fixture, now, await loadClubLogos(), names);

  // Phase 10: real lineups + events from TheSportsDB (committed JSON, covered
  // seasons ≈ 2019-26). Null/[] for uncovered fixtures → page renders the
  // <LineupUnavailable> / <EventsUnavailable> cards.
  const [lineupRaw, eventsRaw, teamColors, extrasMap, players, managersFile] = await Promise.all([
    loadLineup(id, season),
    loadEvents(id, season),
    loadTeamColors(),
    loadFixtureExtras(season),
    loadPlayers(season),
    loadManagers(),
  ]);

  // TASK-M16: attach attendance + (precise) venue from the committed sidecar.
  // TASK-1606 follow-up: localize the sidecar venue on `/ar` too (otherwise this
  // override re-Latinizes what toApiFixture just localized). `names.venue` keys
  // by the home team's id → the home stadium's Arabic; `/en` → the precise Latin
  // ground name (identity).
  const extras = extrasMap?.[id];
  apiFixture.fixture.attendance = extras?.attendance ?? null;
  if (extras?.venue) {
    apiFixture.fixture.venue.name =
      names.venue(apiFixture.teams.home.id, extras.venue) ?? extras.venue;
  }

  // M21: resolve lineup/event/manager names → our stable ids by name, scoped to
  // the two teams' squads + managers for this season (ambiguous → no link).
  const homeId = apiFixture.teams.home.id;
  const awayId = apiFixture.teams.away.id;
  const squad = (players ?? []).filter((p) => p.teamId === homeId || p.teamId === awayId);
  const resolvePlayer = buildNameResolver(squad.map((p) => ({ id: p.id, name: p.name })));
  const mgrEntries = [
    ...(managersFile?.[String(season)]?.[String(homeId)] ?? []),
    ...(managersFile?.[String(season)]?.[String(awayId)] ?? []),
  ];
  const resolveManager = buildNameResolver(mgrEntries.map((m) => ({ id: m.id, name: m.name })));

  return {
    fixture: apiFixture,
    lineups: toFixtureLineups(
      lineupRaw,
      apiFixture.teams.home,
      apiFixture.teams.away,
      teamColors,
      resolvePlayer,
      resolveManager,
      names,
    ),
    statistics: synthesizeStatistics(fixture, apiFixture.teams.home, apiFixture.teams.away),
    events: toFixtureEvents(
      eventsRaw ?? [],
      apiFixture.teams.home,
      apiFixture.teams.away,
      resolvePlayer,
      names,
    ),
  };
}

/**
 * Reshape the committed `FixtureLineups` (home/away raw lineups) into the
 * wire-shaped `FixtureLineup[]` the `<PitchLineup>` consumer expects.
 * The SDP source carries a manager (TASK-M21) → `coach.name`; legacy/older
 * matches have none → empty stub. Per-player `isCaptain` rides along on `player`.
 */
function toFixtureLineups(
  raw: FixtureLineups | null,
  home: FixtureTeam,
  away: FixtureTeam,
  colors: TeamColorsFile | null,
  resolvePlayer: (name: string | null | undefined) => number | null,
  resolveManager: (name: string | null | undefined) => string | null,
  names: EntityNames,
): FixtureLineup[] {
  if (!raw) return [];
  const side = (
    s: FixtureLineups["home"],
    team: FixtureTeam,
    which: "home" | "away",
  ): FixtureLineup => {
    // The home XI wears the home kit, the away XI the away kit (TASK-M47).
    const hex = colors?.[String(team.id)]?.[which] ?? null;
    // M21: tag each player with our /players/[id] id (resolved by name).
    // TASK-1606 follow-up: when the id resolves, localize the display name on
    // `/ar` (the ar maps are id-keyed); an ambiguous/unmatched name stays Latin.
    const slot = (p: FixtureLineups["home"]["startXI"][number]) => {
      const profileId = resolvePlayer(p.name);
      return {
        player: {
          ...p,
          name: profileId != null ? names.player(profileId, p.name) : p.name,
          profileId,
        },
      };
    };
    const managerId = resolveManager(s.manager);
    const coachName =
      managerId != null && s.manager ? names.manager(managerId, s.manager) : (s.manager ?? "");
    return {
      team: { id: team.id, name: team.name, logo: team.logo },
      coach: { id: 0, name: coachName, photo: null, managerId },
      formation: s.formation,
      startXI: s.startXI.map(slot),
      substitutes: s.substitutes.map(slot),
      kit: hex ? resolveKit(hex) : null,
    };
  };
  return [side(raw.home, home, "home"), side(raw.away, away, "away")];
}

/** Reshape committed `MatchEventRaw[]` into the the wire `FixtureEvent[]` shape. */
function toFixtureEvents(
  raw: MatchEventRaw[],
  home: FixtureTeam,
  away: FixtureTeam,
  resolvePlayer: (name: string | null | undefined) => number | null,
  names: EntityNames,
): FixtureEvent[] {
  const teamRef = (id: number) =>
    id === home.id
      ? { id: home.id, name: home.name, logo: home.logo }
      : { id: away.id, name: away.name, logo: away.logo };
  // TASK-1606 follow-up: localize a participant's display name on `/ar` when the
  // by-name resolve produced an id (id-keyed maps); null id → keep Latin.
  const localize = (id: number | null, latin: string | null) =>
    id != null && latin != null ? names.player(id, latin) : latin;
  return raw.map((e) => {
    const playerId = resolvePlayer(e.player);
    const assistId = resolvePlayer(e.assist);
    return {
      time: { elapsed: e.minute, extra: e.extra },
      team: teamRef(e.teamId),
      // M21: resolve the participant names → our /players/[id] id (null → no link).
      player: { id: playerId, name: localize(playerId, e.player) },
      assist: { id: assistId, name: localize(assistId, e.assist) },
      type: e.type,
      detail: e.detail,
      comments: null,
    };
  });
}

type TeamMatchStats = {
  shots: number;
  shotsOnTarget: number;
  corners: number;
  fouls: number;
  yellowCards: number;
  redCards: number;
};

/**
 * Synthesize the `FixtureStatBlock[]` wire shape (two entries —
 * home and away — each with a `statistics[]` array of `{type, value}`
 * rows) from the snapshot's flat `teamStats: { home, away } | null`.
 *
 * Returns `[]` when the snapshot has no teamStats for the fixture (rare but
 * possible if a row was omitted). The `<StatComparison>`
 * consumer handles the empty case with its own copy.
 */
function synthesizeStatistics(
  fixture: { teamStats: { home: TeamMatchStats; away: TeamMatchStats } | null },
  homeTeamRef: FixtureTeam,
  awayTeamRef: FixtureTeam,
): FixtureStatBlock[] {
  if (!fixture.teamStats) return [];

  const rowsFor = (s: TeamMatchStats) => [
    { type: "Shots", value: s.shots },
    { type: "Shots on Goal", value: s.shotsOnTarget },
    { type: "Corner Kicks", value: s.corners },
    { type: "Fouls", value: s.fouls },
    { type: "Yellow Cards", value: s.yellowCards },
    { type: "Red Cards", value: s.redCards },
  ];

  return [
    { team: homeTeamRef, statistics: rowsFor(fixture.teamStats.home) },
    { team: awayTeamRef, statistics: rowsFor(fixture.teamStats.away) },
  ];
}
