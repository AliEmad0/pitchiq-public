import type { Standing } from "@/data/schemas";
import type { RuleResult, TriviaRule } from "../types";

/** Two teams sharing the highest identical goals-scored total, or null. */
function sharedGoals(standings: Standing[]): { goals: number; teams: Standing[] } | null {
  const byValue = new Map<number, Standing[]>();
  for (const s of standings) {
    (byValue.get(s.goalsFor) ?? byValue.set(s.goalsFor, []).get(s.goalsFor)!).push(s);
  }
  const shared = [...byValue.entries()]
    .filter(([, teams]) => teams.length >= 2)
    .sort((a, b) => b[0] - a[0]); // highest shared total first (most striking)
  if (shared.length === 0) return null;
  const [goals, teams] = shared[0];
  const two = [...teams].sort((a, b) => a.teamId - b.teamId).slice(0, 2);
  return { goals, teams: two };
}

/** R9 — Symmetric stats: two teams that scored exactly the same number of goals. */
export const symmetricGoalsRule: TriviaRule = {
  id: "R9",
  title: "Identical goal totals",
  scopes: ["league"],
  async run(data): Promise<RuleResult | null> {
    const standings = await data.standings();
    if (!standings) return null;
    const hit = sharedGoals(standings);
    if (!hit) return null;
    const [a, b] = hit.teams;
    return {
      text: `${a.teamName} and ${b.teamName} both scored exactly ${hit.goals} goals this season.`,
      key: "factSymmetricGoals",
      values: { a: a.teamName, b: b.teamName, goals: hit.goals },
      sources: [
        { kind: "standings", season: data.season, teamId: a.teamId },
        { kind: "standings", season: data.season, teamId: b.teamId },
      ],
      async verify(d) {
        const s = await d.standings();
        if (!s) return false;
        const h = sharedGoals(s);
        return (
          h !== null &&
          h.goals === hit.goals &&
          h.teams[0].teamId === a.teamId &&
          h.teams[1].teamId === b.teamId
        );
      },
    };
  },
};
