import { formatSeasonLabel } from "@/utils/season";

import type { RuleResult, TriviaRule } from "../types";

/** Minimum clean sheets to be a notable defensive season. */
const CS_MIN = 10;

/** R16 — a season with a high clean-sheet tally + the shutout rate (2000+). */
export const goldenGloveRule: TriviaRule = {
  id: "R16",
  title: "Golden glove",
  scopes: ["player"],
  async run(data, ctx): Promise<RuleResult | null> {
    if (ctx.scope !== "player" || ctx.id === undefined) return null;
    const id = ctx.id;
    const p = (await data.players())?.find((x) => x.id === id);
    const cs = p?.metrics.cleanSheets;
    const apps = p?.metrics.appearances;
    if (!p || cs == null || cs < CS_MIN || apps == null || apps <= 0) return null;
    const rate = Math.round((cs / apps) * 100);
    const season = data.season;
    return {
      text: `In ${formatSeasonLabel(season)}, ${p.name}'s team kept ${cs} clean sheets in ${apps} appearances — a shutout in ${rate}% of his games.`,
      key: "factGoldenGlove",
      values: { season, name: p.name, cs, apps, rate },
      sources: [{ kind: "players", season, playerId: id }],
      async verify(dd) {
        const q = (await dd.players(season))?.find((x) => x.id === id);
        const c = q?.metrics.cleanSheets;
        const a = q?.metrics.appearances;
        return c != null && a != null && a > 0 && c === cs && c >= CS_MIN;
      },
    };
  },
};
