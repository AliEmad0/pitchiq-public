import { formatSeasonLabel } from "@/utils/season";

import type { RuleResult, TriviaData, TriviaRule } from "../types";

/** A newly-promoted club (rank > 4) that beat every top-four side, or null. */
async function findGiantKiller(data: TriviaData): Promise<{ name: string } | null> {
  const standings = await data.standings();
  const prev = await data.standings(data.season - 1);
  const fixtures = await data.fixtures();
  if (!standings || !prev || !fixtures) return null;
  const prevIds = new Set(prev.map((s) => s.teamId));
  const top4 = standings.filter((s) => s.rank <= 4).map((s) => s.teamId);
  if (top4.length < 4) return null;
  const won = (club: number, opp: number) =>
    fixtures.some((f) => {
      if (f.homeScore === null || f.awayScore === null) return false;
      if (f.homeTeamId === club && f.awayTeamId === opp) return f.homeScore > f.awayScore;
      if (f.awayTeamId === club && f.homeTeamId === opp) return f.awayScore > f.homeScore;
      return false;
    });
  for (const s of standings) {
    if (s.rank <= 4) continue; // a top-4 finish isn't a giant-killer story
    if (prevIds.has(s.teamId)) continue; // not newly promoted
    if (top4.every((t) => won(s.teamId, t))) return { name: s.teamName };
  }
  return null;
}

/** R26 — a newly-promoted side that beat all four of the season's top-four clubs. */
export const giantKillersRule: TriviaRule = {
  id: "R26",
  title: "Giant killers",
  scopes: ["league"],
  async run(data): Promise<RuleResult | null> {
    const hit = await findGiantKiller(data);
    if (!hit) return null;
    const label = formatSeasonLabel(data.season);
    return {
      text: `Newly-promoted ${hit.name} beat all four of ${label}'s top-four sides in ${label}.`,
      key: "factGiantKillers",
      values: { name: hit.name, season: data.season },
      sources: [{ kind: "standings", season: data.season }],
      async verify(d) {
        const again = await findGiantKiller(d);
        return again?.name === hit.name;
      },
    };
  },
};
