import { formatSeasonLabel } from "@/utils/season";

import type { RuleResult, TriviaRule } from "../types";

/** R25 — a team that broke the 100-point barrier. */
export const centurionsRule: TriviaRule = {
  id: "R25",
  title: "Centurions",
  scopes: ["league"],
  async run(data): Promise<RuleResult | null> {
    const standings = await data.standings();
    if (!standings) return null;
    const top = standings.find((s) => s.points >= 100);
    if (!top) return null;
    const season = data.season;
    return {
      text: `${top.teamName} amassed ${top.points} points in ${formatSeasonLabel(season)} — a 100-point Premier League season.`,
      key: "factCenturions",
      values: { team: top.teamName, points: top.points, season },
      sources: [{ kind: "standings", season, teamId: top.teamId }],
      async verify(d) {
        const s = await d.standings();
        const row = s?.find((x) => x.teamId === top.teamId);
        return !!row && row.points === top.points && row.points >= 100;
      },
    };
  },
};
