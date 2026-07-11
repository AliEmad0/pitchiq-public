import type { Fixture } from "@/data/schemas";
import { formatSeasonLabel } from "@/utils/season";

import type { RuleResult, TriviaRule } from "../types";

/** Minimum scoreless games to be a notable attacking struggle. */
const MIN_SCORELESS = 12;

function scoreless(fixtures: Fixture[], teamId: number): { k: number; n: number } {
  let k = 0,
    n = 0;
  for (const f of fixtures) {
    const home = f.homeTeamId === teamId;
    const away = f.awayTeamId === teamId;
    if (!home && !away) continue;
    if (f.homeScore === null || f.awayScore === null) continue;
    n++;
    const gf = home ? f.homeScore : f.awayScore;
    if (gf === 0) k++;
  }
  return { k, n };
}

/** R19 — a team that failed to score in a notable share of its matches. */
export const failedToScoreRule: TriviaRule = {
  id: "R19",
  title: "Failed to score",
  scopes: ["team"],
  async run(data, ctx): Promise<RuleResult | null> {
    if (ctx.scope !== "team" || ctx.id === undefined) return null;
    const id = ctx.id;
    const [standings, fixtures] = [await data.standings(), await data.fixtures()];
    if (!standings || !fixtures) return null;
    const team = standings.find((s) => s.teamId === id);
    if (!team) return null;
    const { k, n } = scoreless(fixtures, id);
    if (k < MIN_SCORELESS) return null;
    const season = data.season;
    return {
      text: `${team.teamName} failed to score in ${k} of their ${n} matches in ${formatSeasonLabel(season)}.`,
      key: "factFailedToScore",
      values: { team: team.teamName, k, n, season },
      sources: [{ kind: "fixtures", season }],
      async verify(d) {
        const f = await d.fixtures();
        return f !== null && scoreless(f, id).k === k && k >= MIN_SCORELESS;
      },
    };
  },
};
