import type { Fixture, Standing } from "@/data/schemas";
import type { RuleResult, TriviaData, TriviaRule } from "../types";

/** { relevant: bottom-3 vs top-6 games played, upsets: bottom-3 wins over top-6 }. */
function bottomVsTop(
  standings: Standing[],
  fixtures: Fixture[],
): { relevant: number; upsets: number } {
  const n = standings.length;
  const top6 = new Set(standings.filter((s) => s.rank <= 6).map((s) => s.teamId));
  const bottom3 = new Set(standings.filter((s) => s.rank >= n - 2).map((s) => s.teamId));
  let relevant = 0;
  let upsets = 0;
  for (const f of fixtures) {
    if (f.homeScore === null || f.awayScore === null) continue; // not played
    const h = f.homeTeamId;
    const a = f.awayTeamId;
    const matchup = (top6.has(h) && bottom3.has(a)) || (top6.has(a) && bottom3.has(h));
    if (!matchup) continue;
    relevant++;
    if (f.homeScore === f.awayScore) continue; // draw — not an upset
    const winner = f.homeScore > f.awayScore ? h : a;
    const loser = f.homeScore > f.awayScore ? a : h;
    if (bottom3.has(winner) && top6.has(loser)) upsets++;
  }
  return { relevant, upsets };
}

/** R4 — Head-to-head perfection: no bottom-3 side has beaten a top-6 side yet. */
export const headToHeadRule: TriviaRule = {
  id: "R4",
  title: "No bottom-3 win over a top-6 side",
  scopes: ["league"],
  async run(data): Promise<RuleResult | null> {
    const [standings, fixtures] = [await data.standings(), await data.fixtures()];
    if (!standings || !fixtures || standings.length < 9) return null;
    const { relevant, upsets } = bottomVsTop(standings, fixtures);
    if (relevant === 0 || upsets > 0) return null; // vacuous or already broken
    return {
      text: `No team in the bottom three has beaten a top-six side this season — across ${relevant} such meetings.`,
      key: "factHeadToHead",
      values: { relevant },
      sources: [{ kind: "standings", season: data.season }],
      async verify(d: TriviaData) {
        const [s, f] = [await d.standings(), await d.fixtures()];
        if (!s || !f) return false;
        const r = bottomVsTop(s, f);
        return r.relevant === relevant && r.upsets === 0;
      },
    };
  },
};
