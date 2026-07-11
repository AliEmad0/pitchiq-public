import type { RuleResult, TriviaData, TriviaRule } from "../types";

const MIN_SEASONS = 3;

/** English ordinal: 1 → "1st", 2 → "2nd", 11 → "11th". */
export function ordinal(n: number): string {
  const v = n % 100;
  const suffix = v >= 11 && v <= 13 ? "th" : (["th", "st", "nd", "rd"][n % 10] ?? "th");
  return `${n}${suffix}`;
}

async function teamRankBySeason(
  data: TriviaData,
  teamId: number,
): Promise<Array<{ season: number; rank: number }>> {
  const out: Array<{ season: number; rank: number }> = [];
  for (const s of await data.seasons()) {
    const st = await data.standings(s);
    const row = st?.find((r) => r.teamId === teamId);
    if (row) out.push({ season: s, rank: row.rank });
  }
  return out;
}

/** R5 — Cross-season: this is the team's best league position in our data. */
export const positionRecordRule: TriviaRule = {
  id: "R5",
  title: "Best league position",
  scopes: ["team"],
  async run(data, ctx): Promise<RuleResult | null> {
    if (ctx.scope !== "team" || ctx.id === undefined) return null;
    const teamId = ctx.id;
    const hist = await teamRankBySeason(data, teamId);
    if (hist.length < MIN_SEASONS) return null;
    const current = hist.find((x) => x.season === data.season);
    if (!current) return null;
    const bestOther = Math.min(...hist.filter((x) => x.season !== data.season).map((x) => x.rank));
    if (current.rank >= bestOther) return null; // not a new best (lower rank = better)
    const team = (await data.standings())?.find((r) => r.teamId === teamId);
    if (!team) return null;
    return {
      text: `${team.teamName}'s ${ordinal(current.rank)}-place standing is their best in the ${hist.length} seasons of data we hold.`,
      key: "factPositionRecord",
      values: { team: team.teamName, rank: current.rank, n: hist.length },
      sources: hist.map((h) => ({ kind: "standings", season: h.season, teamId })),
      async verify(d) {
        const h = await teamRankBySeason(d, teamId);
        if (h.length < MIN_SEASONS) return false;
        const cur = h.find((x) => x.season === d.season);
        if (!cur || cur.rank !== current.rank) return false;
        return cur.rank < Math.min(...h.filter((x) => x.season !== d.season).map((x) => x.rank));
      },
    };
  },
};
