import type { Leaderboards, Standing } from "@/data/schemas";
import type { RuleResult, TriviaRule } from "../types";

function outscoredTeams(lb: Leaderboards, standings: Standing[]) {
  const top = lb.topScorers[0];
  if (!top || top.value <= 0) return null;
  const teams = standings.filter((s) => s.goalsFor < top.value);
  if (teams.length === 0) return null;
  return { top, teams };
}

/** R2 — Player vs collective: the top scorer outscored entire clubs by himself. */
export const playerVsCollectiveRule: TriviaRule = {
  id: "R2",
  title: "Top scorer vs whole teams",
  scopes: ["league"],
  async run(data): Promise<RuleResult | null> {
    const [lb, standings] = [await data.leaderboards(), await data.standings()];
    if (!lb || !standings) return null;
    const hit = outscoredTeams(lb, standings);
    if (!hit) return null;
    const { top, teams } = hit;
    return {
      text: `${top.playerName} has scored more goals on his own (${top.value}) than ${teams.length} of the league's clubs managed all season.`,
      key: "factPlayerVsCollective",
      values: { player: top.playerName, value: top.value, teams: teams.length },
      sources: [
        { kind: "leaderboard", season: data.season, metric: "scorers" },
        ...teams.map((t) => ({
          kind: "standings" as const,
          season: data.season,
          teamId: t.teamId,
        })),
      ],
      async verify(d) {
        const [l, s] = [await d.leaderboards(), await d.standings()];
        if (!l || !s) return false;
        const h = outscoredTeams(l, s);
        return h !== null && h.top.value === top.value && h.teams.length === teams.length;
      },
    };
  },
};
