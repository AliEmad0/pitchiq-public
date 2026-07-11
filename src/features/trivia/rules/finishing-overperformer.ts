import { formatSeasonLabel } from "@/utils/season";

import type { RuleResult, TriviaRule } from "../types";

/** Minimum goals-minus-xG to be a notable "clinical finisher" season. */
const DELTA_MIN = 5;

function delta(goals: number, xg: number): number {
  return Math.round((goals - xg) * 10) / 10;
}

/** R14 — a season where a player's goals beat their xG by a clear margin (2017+). */
export const finishingOverperformerRule: TriviaRule = {
  id: "R14",
  title: "Finishing overperformer",
  scopes: ["player"],
  async run(data, ctx): Promise<RuleResult | null> {
    if (ctx.scope !== "player" || ctx.id === undefined) return null;
    const id = ctx.id;
    const p = (await data.players())?.find((x) => x.id === id);
    const goals = p?.metrics.goals;
    const xg = p?.metrics.xg;
    if (!p || goals == null || xg == null) return null;
    const d = delta(goals, xg);
    if (d < DELTA_MIN) return null;
    const season = data.season;
    return {
      text: `In ${formatSeasonLabel(season)}, ${p.name} scored ${goals} goals from just ${xg} xG — outperforming his expected goals by +${d}.`,
      key: "factFinishingOverperformer",
      values: { season, name: p.name, goals, xg, d },
      sources: [{ kind: "players", season, playerId: id }],
      async verify(dd) {
        const q = (await dd.players(season))?.find((x) => x.id === id);
        const g = q?.metrics.goals;
        const x = q?.metrics.xg;
        return g != null && x != null && delta(g, x) === d && d >= DELTA_MIN;
      },
    };
  },
};
