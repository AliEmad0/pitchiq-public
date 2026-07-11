import type { Standing } from "@/data/schemas";
import type { RuleResult, TriviaRule } from "../types";

const ORDINAL_FEWEST = ["fewest", "second-fewest", "third-fewest"];
function fewestLabel(zeroBasedRank: number): string {
  return ORDINAL_FEWEST[zeroBasedRank] ?? `${zeroBasedRank + 1}th-fewest`;
}

/** The unique top-scoring team + its rank (ascending) for goals conceded. */
function topScorer(standings: Standing[]): { team: Standing; concededRank: number } | null {
  const byGoals = [...standings].sort((a, b) => b.goalsFor - a.goalsFor);
  if (byGoals.length < 2) return null;
  if (byGoals[0].goalsFor === byGoals[1].goalsFor) return null; // tie → no unique leader
  const team = byGoals[0];
  const concededRank = [...standings]
    .sort((a, b) => a.goalsAgainst - b.goalsAgainst)
    .findIndex((s) => s.teamId === team.teamId);
  return { team, concededRank };
}

/** R1 — Goal extremes: the league's top-scoring team + how mean its defence is. */
export const goalExtremesRule: TriviaRule = {
  id: "R1",
  title: "Top-scoring team",
  scopes: ["league", "team"],
  async run(data, ctx): Promise<RuleResult | null> {
    const standings = await data.standings();
    if (!standings) return null;
    const top = topScorer(standings);
    if (!top) return null;
    if (ctx.scope === "team" && ctx.id !== top.team.teamId) return null;
    const { team, concededRank } = top;
    return {
      text: `${team.teamName} scored the most goals in the league (${team.goalsFor}) and conceded the ${fewestLabel(concededRank)} (${team.goalsAgainst}).`,
      // The exact "second/third-fewest" ordinal is hard to render grammatically
      // in Arabic, so the localized form reads "among the fewest" (still true —
      // concededRank is 0-2). English keeps the precise ordinal via `text`.
      key: "factGoalExtremes",
      values: { team: team.teamName, goalsFor: team.goalsFor, goalsAgainst: team.goalsAgainst },
      sources: [{ kind: "standings", season: data.season, teamId: team.teamId }],
      async verify(d) {
        const s = await d.standings();
        if (!s) return false;
        const t = topScorer(s);
        return (
          t !== null &&
          t.team.teamId === team.teamId &&
          t.team.goalsFor === team.goalsFor &&
          t.team.goalsAgainst === team.goalsAgainst &&
          t.concededRank === concededRank
        );
      },
    };
  },
};
