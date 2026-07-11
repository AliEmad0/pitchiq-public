import { formatSeasonLabel } from "@/utils/season";

import type { RuleResult, TriviaRule } from "../types";

/** Minimum expected assists (xA) to be a notable creator season. */
const XA_MIN = 8;

/** R15 — a season where a player generated a high expected-assist total (2017+). */
export const creativeArchitectRule: TriviaRule = {
  id: "R15",
  title: "Creative architect",
  scopes: ["player"],
  async run(data, ctx): Promise<RuleResult | null> {
    if (ctx.scope !== "player" || ctx.id === undefined) return null;
    const id = ctx.id;
    const p = (await data.players())?.find((x) => x.id === id);
    const xa = p?.metrics.xa;
    if (!p || xa == null || xa < XA_MIN) return null;
    const assists = p.metrics.assists ?? 0;
    const season = data.season;
    return {
      text: `In ${formatSeasonLabel(season)}, ${p.name} created chances worth ${xa} expected assists (${assists} actual assists).`,
      key: "factCreativeArchitect",
      values: { season, name: p.name, xa, assists },
      sources: [{ kind: "players", season, playerId: id }],
      async verify(dd) {
        const q = (await dd.players(season))?.find((x) => x.id === id);
        const x = q?.metrics.xa;
        return x != null && x === xa && x >= XA_MIN;
      },
    };
  },
};
