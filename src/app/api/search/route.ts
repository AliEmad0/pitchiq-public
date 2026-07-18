import { NextResponse } from "next/server";

import { loadSearchIndex } from "@/data/loaders";
import { getEntityNames } from "@/features/i18n/entity-names";
import type { SearchIndex } from "@/data/schemas";
import { logger } from "@/utils/logger";
import { nameAcronym } from "@/utils/search-acronym";

// Combined teams + players + managers search for the global header palette
// (TASK-907 / TASK-M51 follow-up), served from the committed CROSS-SEASON index
// (TASK-M08) so historical players/clubs/managers are findable regardless of the
// active season. Dynamic — freshness comes from the client TanStack Query
// staleTime.
export const revalidate = 0;

// Min 2 chars: team names are short ("ars" → Arsenal) and the lookup is a local
// substring scan, so a 2-char floor is cheap and friendlier than the player
// route's 3.
const MIN_QUERY_LENGTH = 2;
const MAX_TEAMS = 6;
const MAX_MANAGERS = 6;
// Cap players: the index spans ~34 seasons of distinct ids, so a broad substring
// could otherwise return a huge payload. Raised from 8 (TASK-M29) so relevance
// ranking has room to surface the intended name without truncating it away.
const MAX_PLAYERS = 20;

// A match is "stronger" (tier 0) when a WORD in the name starts with the query
// ("van" → "van Persie"), vs an incidental substring elsewhere ("Cavani",
// "Ivan") which is tier 1. Lower tier sorts first.
function matchTier(name: string, needle: string): number {
  const lower = name.toLowerCase();
  if (lower.split(/\s+/).some((word) => word.startsWith(needle))) return 0;
  return 1;
}

// Match tier for a player: a name word-start or an alias/acronym hit is tier 0
// (top), an incidental name substring is tier 1, no match is null (excluded).
// TASK-M30: aliases ("cr7") + auto-derived initials ("kdb") let nickname queries
// surface players whose formal name doesn't contain the query at all.
function playerTier(p: SearchIndex["players"][number], needle: string): number | null {
  const lower = p.name.toLowerCase();
  if (lower.includes(needle)) {
    return lower.split(/\s+/).some((word) => word.startsWith(needle)) ? 0 : 1;
  }
  if (p.aliases?.some((alias) => alias.startsWith(needle))) return 0;
  // TASK-1606: an Arabic-query hit on the Arabic name is a top-tier match.
  if (p.nameAr && p.nameAr.includes(needle)) return 0;
  // Initials: a 2-4 letter all-alpha query equal to the name's acronym.
  if (/^[a-z]{2,4}$/.test(needle) && nameAcronym(p.name) === needle) return 0;
  return null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") ?? "").trim();
  if (query.length < MIN_QUERY_LENGTH) {
    return NextResponse.json({ error: "q_too_short" }, { status: 400 });
  }

  const index = await loadSearchIndex();
  if (index === null) {
    logger.warn("search.route.index_unavailable", { query });
    return NextResponse.json({ error: "search_unavailable" }, { status: 502 });
  }

  const needle = query.toLowerCase();
  // TASK-1606: on /ar, match against the Arabic name too + render it.
  const locale = searchParams.get("locale") ?? "en";
  const isAr = locale.startsWith("ar");
  // Resolver for the per-player club label — the index only bakes each entity's
  // OWN Arabic name (a team's `nameAr`), not a per-player club name, so localize
  // it here by team id (identity passthrough on /en). Mirrors searchPlayers().
  const names = await getEntityNames(locale);

  // Teams: word-start matches first, then alphabetical.
  const teams = index.teams
    .filter((t) => t.name.toLowerCase().includes(needle) || (t.nameAr ?? "").includes(needle))
    .sort(
      (a, b) =>
        matchTier(a.name, needle) - matchTier(b.name, needle) || a.name.localeCompare(b.name),
    )
    .slice(0, MAX_TEAMS)
    .map((t) => ({
      id: t.id,
      name: isAr ? (t.nameAr ?? t.name) : t.name,
      logo: `/logos/${t.id}.png`,
      season: t.latestSeason,
    }));

  // Players: rank by (TASK-M29) word-start tier, then prominence (career goals +
  // assists, then appearances as a tiebreak so famous defenders/keepers don't sink),
  // then name. The link carries `?season=latestSeason` so the result lands on a
  // season the entity has data for (otherwise /players/[id] defaults to the current
  // season → <DataUnavailable> for a historical-only player).
  const players = index.players
    .map((p) => ({ p, tier: playerTier(p, needle) }))
    .filter((x): x is { p: (typeof x)["p"]; tier: number } => x.tier !== null)
    .sort(
      (a, b) =>
        a.tier - b.tier ||
        (b.p.ga ?? 0) - (a.p.ga ?? 0) ||
        (b.p.apps ?? 0) - (a.p.apps ?? 0) ||
        a.p.name.localeCompare(b.p.name),
    )
    .slice(0, MAX_PLAYERS)
    .map(({ p }) => ({
      id: p.id,
      name: isAr ? (p.nameAr ?? p.name) : p.name,
      // Club label localized by team id on /ar (identity on /en) — the index
      // bakes no per-player Arabic club name of its own.
      team: {
        id: p.teamId,
        name: names.team(p.teamId, p.teamName),
        logo: `/logos/${p.teamId}.png`,
      },
      photo: p.photo ?? "",
      season: p.latestSeason,
    }));

  // Managers: word-start matches first, then alphabetical (mirrors teams). The
  // link carries `?season=latestSeason` so the manager profile resolves. Manager
  // ids are strings (`58` or `lm-<slug>`); `photo` is the bio URL or "" (→ the
  // result row falls back to initials, same as players).
  const managers = (index.managers ?? [])
    .filter((m) => m.name.toLowerCase().includes(needle) || (m.nameAr ?? "").includes(needle))
    .sort(
      (a, b) =>
        matchTier(a.name, needle) - matchTier(b.name, needle) || a.name.localeCompare(b.name),
    )
    .slice(0, MAX_MANAGERS)
    .map((m) => ({
      id: m.id,
      name: isAr ? (m.nameAr ?? m.name) : m.name,
      photo: m.photo ?? "",
      season: m.latestSeason,
    }));

  return NextResponse.json({ teams, players, managers });
}
