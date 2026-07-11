import type { ManagerIndexRow } from "@/features/managers/managers-index.api";

/**
 * Season "highlights" for the managers index (TASK-1509 "win% KPI tiles"): the
 * leaders in points / wins / win% / PPG. Pure + testable. The rate stats
 * (win%, PPG) are gated to a minimum match count so a 2-game caretaker can't
 * top them; if no one clears the bar the whole pool is used as a fallback.
 */
export type SeasonHighlights = {
  mostPoints: ManagerIndexRow | null;
  mostWins: ManagerIndexRow | null;
  bestWinPct: ManagerIndexRow | null;
  bestPpg: ManagerIndexRow | null;
};

// Half a 38-game season — keeps a mid-season interim with a hot 12-game run
// from topping "best win% / PPG" over a manager's full body of work.
const MIN_MATCHES = 19;

export function seasonHighlights(rows: ManagerIndexRow[]): SeasonHighlights {
  const top = (metric: (r: ManagerIndexRow) => number, minMatches = 0): ManagerIndexRow | null => {
    if (rows.length === 0) return null;
    const eligible = minMatches ? rows.filter((r) => r.record.played >= minMatches) : rows;
    const pool = eligible.length > 0 ? eligible : rows;
    return [...pool].sort(
      (a, b) => metric(b) - metric(a) || a.managerId.localeCompare(b.managerId),
    )[0];
  };

  return {
    mostPoints: top((r) => r.record.points),
    mostWins: top((r) => r.record.win),
    bestWinPct: top((r) => r.record.winPct, MIN_MATCHES),
    bestPpg: top((r) => r.record.ppg, MIN_MATCHES),
  };
}
