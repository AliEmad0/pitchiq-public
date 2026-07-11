import { formatSeasonLabel } from "@/utils/season";

import type { RuleResult, TriviaRule } from "../types";

/** R24 — the points total of the team that finished just above the drop (20-team seasons). */
export const survivalThresholdRule: TriviaRule = {
  id: "R24",
  title: "Survival threshold",
  scopes: ["league"],
  async run(data): Promise<RuleResult | null> {
    const standings = await data.standings();
    if (!standings || standings.length !== 20) return null; // 3 relegated → rank 17 is the safety line
    const safe = standings.find((s) => s.rank === 17);
    if (!safe) return null;
    const season = data.season;
    return {
      text: `The last team to avoid relegation in ${formatSeasonLabel(season)} stayed up on ${safe.points} points.`,
      key: "factSurvival",
      values: { season, points: safe.points },
      sources: [{ kind: "standings", season }],
      async verify(d) {
        const s = await d.standings();
        const row = s?.find((x) => x.rank === 17);
        return s?.length === 20 && !!row && row.points === safe.points;
      },
    };
  },
};
