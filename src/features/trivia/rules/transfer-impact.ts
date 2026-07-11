import { formatSeasonLabel } from "@/utils/season";

import type { RuleResult, TriviaRule } from "../types";

/** Join club names: "A and B" for two, "A, B and C" for more. */
function joinClubs(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

/** R17 — a mid-season transferee's combined output across the clubs they played for. */
export const transferImpactRule: TriviaRule = {
  id: "R17",
  title: "Transfer impact",
  scopes: ["player"],
  async run(data, ctx): Promise<RuleResult | null> {
    if (ctx.scope !== "player" || ctx.id === undefined) return null;
    const id = ctx.id;
    const p = (await data.players())?.find((x) => x.id === id);
    const splits = p?.splits;
    if (!p || !splits || splits.length < 2) return null;
    const goals = splits.reduce((s, x) => s + (x.goals ?? 0), 0);
    const assists = splits.reduce((s, x) => s + (x.assists ?? 0), 0);
    const clubs = joinClubs(splits.map((x) => x.teamName));
    const season = data.season;
    return {
      text: `In ${formatSeasonLabel(season)}, ${p.name} turned out for ${clubs}, contributing ${goals} goals and ${assists} assists across them.`,
      key: "factTransferImpact",
      values: { season, name: p.name, clubs, goals, assists },
      sources: [{ kind: "players", season, playerId: id }],
      async verify(dd) {
        const q = (await dd.players(season))?.find((x) => x.id === id);
        return !!q?.splits && q.splits.length >= 2;
      },
    };
  },
};
