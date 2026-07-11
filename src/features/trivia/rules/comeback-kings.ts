import type { Fixture } from "@/data/schemas";
import { formatSeasonLabel } from "@/utils/season";

import type { RuleResult, TriviaRule } from "../types";

/** Minimum from-behind wins to be notable. */
const MIN_COMEBACKS = 3;

function comebackWins(fixtures: Fixture[], teamId: number): number {
  let k = 0;
  for (const f of fixtures) {
    const home = f.homeTeamId === teamId;
    const away = f.awayTeamId === teamId;
    if (!home && !away) continue;
    if (f.homeScore === null || f.awayScore === null || f.halfTime === null) continue;
    const htFor = home ? f.halfTime.home : f.halfTime.away;
    const htAgainst = home ? f.halfTime.away : f.halfTime.home;
    const ftFor = home ? f.homeScore : f.awayScore;
    const ftAgainst = home ? f.awayScore : f.homeScore;
    if (htFor < htAgainst && ftFor > ftAgainst) k++;
  }
  return k;
}

/** R20 — a team that repeatedly won after trailing at half-time (1995+). */
export const comebackKingsRule: TriviaRule = {
  id: "R20",
  title: "Comeback kings",
  scopes: ["team"],
  async run(data, ctx): Promise<RuleResult | null> {
    if (ctx.scope !== "team" || ctx.id === undefined) return null;
    const id = ctx.id;
    const [standings, fixtures] = [await data.standings(), await data.fixtures()];
    if (!standings || !fixtures) return null;
    const team = standings.find((s) => s.teamId === id);
    if (!team) return null;
    const k = comebackWins(fixtures, id);
    if (k < MIN_COMEBACKS) return null;
    const season = data.season;
    return {
      text: `${team.teamName} came from behind at half-time to win ${k} times in ${formatSeasonLabel(season)}.`,
      key: "factComebackKings",
      values: { team: team.teamName, k, season },
      sources: [{ kind: "fixtures", season }],
      async verify(d) {
        const f = await d.fixtures();
        return f !== null && comebackWins(f, id) === k && k >= MIN_COMEBACKS;
      },
    };
  },
};
