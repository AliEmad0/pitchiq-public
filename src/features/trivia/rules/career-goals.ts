import type { RuleResult, TriviaData, TriviaRule } from "../types";

/** Career-goals threshold worth surfacing (and the milestone granularity). */
const MILESTONE = 50;

async function careerGoals(
  data: TriviaData,
  playerId: number,
): Promise<{ total: number; name: string; seasons: number[] }> {
  let total = 0;
  let name = "";
  const seasons: number[] = [];
  for (const s of await data.seasons()) {
    // seasons() is newest-first, so the first name we see is the most recent.
    const p = (await data.players(s))?.find((x) => x.id === playerId);
    if (p) {
      total += p.metrics.goals ?? 0;
      if (!name) name = p.name;
      seasons.push(s);
    }
  }
  return { total, name, seasons };
}

/** R6 — Career milestone: a player's total goals across all seasons in our data. */
export const careerGoalsRule: TriviaRule = {
  id: "R6",
  title: "Career goals",
  scopes: ["player"],
  async run(data, ctx): Promise<RuleResult | null> {
    if (ctx.scope !== "player" || ctx.id === undefined) return null;
    const playerId = ctx.id;
    const { total, name, seasons } = await careerGoals(data, playerId);
    if (total < MILESTONE) return null;
    const milestone = Math.floor(total / MILESTONE) * MILESTONE;
    return {
      text: `${name} has scored ${total} Premier League goals across the seasons in our data — past the ${milestone} mark.`,
      key: "factCareerGoals",
      values: { name, total, milestone },
      sources: seasons.map((s) => ({ kind: "players", season: s, playerId })),
      async verify(d) {
        const c = await careerGoals(d, playerId);
        return c.total === total && c.total >= MILESTONE;
      },
    };
  },
};
