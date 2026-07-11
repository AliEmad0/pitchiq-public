import type { StatLeaderboardEntry } from "@/features/players/components/StatLeaderboard";
import type { PlayerLeaderboardEntry, PlayerStatisticsEntry } from "@/types/api";

// Adapt the the wire wire shape (TASK-201) into the display contract
// `StatLeaderboard` accepts. Lives outside `page.tsx` because Next 15
// forbids arbitrary named exports from a route module (only `default` and
// the recognized metadata/config exports are allowed).
//
// The 1-entry `statistics` invariant is the fetcher boundary's job
// (TASK-202 logs `leaderboard.invariant_violation` on drift). Here we just
// take the first record and fall back gracefully so a transient malformed
// entry can't crash the dashboard.

type ValueSelector = (stats: PlayerStatisticsEntry) => number | null;

// All four leaderboards share the same wire shape; only the value field
// they're sorted by differs. A single factory keeps the per-kind adapters
// to a one-line definition each.
function adapterFor(valueOf: ValueSelector) {
  return (entry: PlayerLeaderboardEntry, index: number): StatLeaderboardEntry => {
    const stats = entry.statistics[0];
    return {
      rank: index + 1,
      name: entry.player.name,
      playerId: entry.player.id,
      team: stats?.team.name ?? "—",
      teamId: stats?.team.id ?? null,
      photo: entry.player.photo,
      value: (stats !== undefined ? valueOf(stats) : null) ?? 0,
    };
  };
}

export const toGoalsEntry = adapterFor((s) => s.goals.total);
export const toAssistsEntry = adapterFor((s) => s.goals.assists);
export const toYellowCardsEntry = adapterFor((s) => s.cards.yellow);
export const toRedCardsEntry = adapterFor((s) => s.cards.red);
