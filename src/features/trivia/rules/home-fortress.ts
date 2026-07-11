import type { Fixture } from "@/data/schemas";
import { formatSeasonLabel } from "@/utils/season";

import type { RuleResult, TriviaRule } from "../types";

/** Minimum home games for an "unbeaten at home" claim (avoid in-progress seasons). */
const MIN_HOME_GAMES = 15;

/** Home record from the team's perspective: completed home games only. */
function homeRecord(
  fixtures: Fixture[],
  teamId: number,
): { w: number; d: number; l: number; n: number } {
  let w = 0,
    d = 0,
    l = 0,
    n = 0;
  for (const f of fixtures) {
    if (f.homeTeamId !== teamId) continue;
    if (f.homeScore === null || f.awayScore === null) continue;
    n++;
    if (f.homeScore > f.awayScore) w++;
    else if (f.homeScore === f.awayScore) d++;
    else l++;
  }
  return { w, d, l, n };
}

/** R18 — a team that went a full season unbeaten at home. */
export const homeFortressRule: TriviaRule = {
  id: "R18",
  title: "Home fortress",
  scopes: ["team"],
  async run(data, ctx): Promise<RuleResult | null> {
    if (ctx.scope !== "team" || ctx.id === undefined) return null;
    const id = ctx.id;
    const [standings, fixtures] = [await data.standings(), await data.fixtures()];
    if (!standings || !fixtures) return null;
    const team = standings.find((s) => s.teamId === id);
    if (!team) return null;
    const r = homeRecord(fixtures, id);
    if (r.l !== 0 || r.n < MIN_HOME_GAMES) return null;
    const season = data.season;
    return {
      text: `${team.teamName} were unbeaten at home in ${formatSeasonLabel(season)} — ${r.w} wins and ${r.d} draws from ${r.n} home games.`,
      key: "factHomeFortress",
      values: { team: team.teamName, season, w: r.w, d: r.d, n: r.n },
      sources: [{ kind: "fixtures", season }],
      async verify(d) {
        const f = await d.fixtures();
        if (!f) return false;
        const rr = homeRecord(f, id);
        return rr.l === 0 && rr.n >= MIN_HOME_GAMES;
      },
    };
  },
};
