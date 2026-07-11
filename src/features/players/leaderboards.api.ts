import "server-only";

import { getEntityNames } from "@/features/i18n/entity-names";
import {
  loadClubLogos,
  loadLeaderboard,
  loadPlayers,
  type LeaderboardKind as LoaderKind,
} from "@/data/loaders";
import type { ClubLogosFile } from "@/data/schemas";
import { clubLogoFromMap } from "@/utils/club-logo";
import type { PlayerLeaderboardEntry, PlayerStatisticsEntry } from "@/types/api";
import { leaderboardTag, type LeaderboardKind } from "@/utils/cache-tags";
import { logger } from "@/utils/logger";

// Four leaderboard endpoints share the same loader; the only
// difference is the loader kind (slug) and which statistics sub-key holds
// the pre-computed ranking value. The result is synthesized into the
// `PlayerLeaderboardEntry` wire shape so existing consumers
// (leaderboard-adapter.ts → StatLeaderboard) require zero changes.

// Trim to the leaderboard's top-N before returning.
const TOP_N = 10;

// Map cache-tags LeaderboardKind ("topscorers" …) → loader LeaderboardKind
// ("scorers" …). The two namespaces differ because cache-tags follow the
// legacy URL slugs while the loader uses the snapshot's own
// naming convention.
const KIND_TO_LOADER: Record<LeaderboardKind, LoaderKind> = {
  topscorers: "scorers",
  topassists: "assists",
  topyellowcards: "yellow-cards",
  topredcards: "red-cards",
};

/**
 * Synthesize a single `PlayerStatisticsEntry` from a flat snapshot
 * `LeaderboardEntry`. Only the fields read by `leaderboard-adapter.ts` are
 * populated; everything else is set to `null` or a safe default.
 *
 * Adapter sub-key usage confirmed (src/features/players/leaderboard-adapter.ts):
 *   toGoalsEntry      → s.goals.total
 *   toAssistsEntry    → s.goals.assists
 *   toYellowCardsEntry → s.cards.yellow
 *   toRedCardsEntry   → s.cards.red
 *   all adapters      → s.team.name
 */
function synthesizeStatistics(
  kind: LeaderboardKind,
  teamId: number,
  teamName: string,
  value: number,
  season: number,
  clubLogos: ClubLogosFile | null,
): PlayerStatisticsEntry {
  const goals = {
    total: kind === "topscorers" ? value : null,
    conceded: null,
    assists: kind === "topassists" ? value : null,
    saves: null,
  };

  const cards = {
    yellow: kind === "topyellowcards" ? value : null,
    yellowred: null,
    red: kind === "topredcards" ? value : null,
  };

  return {
    team: { id: teamId, name: teamName, logo: clubLogoFromMap(teamId, season, clubLogos) },
    league: {
      id: 39,
      name: "Premier League",
      country: "England",
      logo: "",
      flag: null,
      season: 0, // overridden per-call but not read by any consumer
    },
    games: {
      appearences: null,
      lineups: null,
      minutes: null,
      number: null,
      position: null,
      rating: null,
      captain: false,
    },
    substitutes: { in: null, out: null, bench: null },
    shots: { total: null, on: null },
    goals,
    passes: { total: null, key: null, accuracy: null },
    tackles: { total: null, blocks: null, interceptions: null },
    duels: { total: null, won: null },
    dribbles: { attempts: null, success: null, past: null },
    fouls: { drawn: null, committed: null },
    cards,
    penalty: { won: null, commited: null, scored: null, missed: null, saved: null },
  };
}

// `locale` (TASK-1606 follow-up): passed by the client-driven suggested/route
// paths (which have no `[locale]` request context) so player + club names
// localize on `/ar`; omitted for the server-rendered dashboard/leaderboards
// pages, where `getEntityNames()` reads the request context.
type GetLeaderboardArgs = { league?: number; season: number; locale?: string };

async function getLeaderboard(
  kind: LeaderboardKind,
  { season, locale }: GetLeaderboardArgs,
): Promise<PlayerLeaderboardEntry[] | null> {
  const loaderKind = KIND_TO_LOADER[kind];
  const tag = leaderboardTag(kind, season);

  const entries = await loadLeaderboard(loaderKind, season);

  if (!entries) {
    logger.warn("leaderboard.load_failed", { kind, loaderKind, season, tag });
    return null;
  }

  // Join player photos (FPL asset codes populated by TASK-602) by id, so the
  // dashboard leaderboard avatars render real photos via <PlayerImage>. The
  // leaderboard JSON itself doesn't carry the photo column, so look it up from
  // the players snapshot. A failed/missing load degrades each entry to "" (the
  // initials fallback) rather than failing the whole board.
  const players = await loadPlayers(season);
  const photoById = new Map<number, string>();
  for (const p of players ?? []) {
    if (p.photo) photoById.set(p.id, p.photo);
  }
  const clubLogos = await loadClubLogos();
  // TASK-1606 follow-up: localize the player + club name on `/ar` (the board
  // JSON stores Latin source names; the ar maps are keyed by the same stable
  // ids). `/en` → identity, so English output is byte-unchanged.
  const names = await getEntityNames(locale);

  const top = entries.slice(0, TOP_N);

  return top.map(
    (entry): PlayerLeaderboardEntry => ({
      player: {
        id: entry.playerId,
        name: names.player(entry.playerId, entry.playerName),
        firstname: "",
        lastname: "",
        age: 0,
        birth: { date: "", place: null, country: null },
        nationality: "",
        height: null,
        weight: null,
        injured: false,
        // FPL asset code (numeric string) when the player matched during sync,
        // else "" → <PlayerImage> falls back to an initials monogram.
        photo: photoById.get(entry.playerId) ?? "",
      },
      statistics: [
        synthesizeStatistics(
          kind,
          entry.teamId,
          names.team(entry.teamId, entry.teamName),
          entry.value,
          season,
          clubLogos,
        ),
      ],
    }),
  );
}

export function getTopScorers(args: GetLeaderboardArgs) {
  return getLeaderboard("topscorers", args);
}

export function getTopAssists(args: GetLeaderboardArgs) {
  return getLeaderboard("topassists", args);
}

export function getTopYellowCards(args: GetLeaderboardArgs) {
  return getLeaderboard("topyellowcards", args);
}

export function getTopRedCards(args: GetLeaderboardArgs) {
  return getLeaderboard("topredcards", args);
}
