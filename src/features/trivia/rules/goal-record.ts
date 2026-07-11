import type { RuleResult, TriviaData, TriviaRule } from "../types";

const MIN_SEASONS = 3;

async function teamGoalsBySeason(
  data: TriviaData,
  teamId: number,
): Promise<Array<{ season: number; gf: number }>> {
  const out: Array<{ season: number; gf: number }> = [];
  for (const s of await data.seasons()) {
    const st = await data.standings(s);
    const row = st?.find((r) => r.teamId === teamId);
    if (row) out.push({ season: s, gf: row.goalsFor });
  }
  return out;
}

/** R3 — Cross-season: this is the team's highest-scoring season in our data. */
export const goalRecordRule: TriviaRule = {
  id: "R3",
  title: "Most goals in a season",
  scopes: ["team"],
  async run(data, ctx): Promise<RuleResult | null> {
    if (ctx.scope !== "team" || ctx.id === undefined) return null;
    const teamId = ctx.id;
    const hist = await teamGoalsBySeason(data, teamId);
    if (hist.length < MIN_SEASONS) return null;
    const current = hist.find((x) => x.season === data.season);
    if (!current) return null;
    const maxOther = Math.max(...hist.filter((x) => x.season !== data.season).map((x) => x.gf));
    if (current.gf <= maxOther) return null; // not a record
    const team = (await data.standings())?.find((r) => r.teamId === teamId);
    if (!team) return null;
    return {
      text: `${team.teamName}'s ${current.gf} goals this season is their highest in the ${hist.length} seasons of data we hold.`,
      key: "factGoalRecord",
      values: { team: team.teamName, gf: current.gf, n: hist.length },
      sources: hist.map((h) => ({ kind: "standings", season: h.season, teamId })),
      async verify(d) {
        const h = await teamGoalsBySeason(d, teamId);
        if (h.length < MIN_SEASONS) return false;
        const cur = h.find((x) => x.season === d.season);
        if (!cur || cur.gf !== current.gf) return false;
        return cur.gf > Math.max(...h.filter((x) => x.season !== d.season).map((x) => x.gf));
      },
    };
  },
};
