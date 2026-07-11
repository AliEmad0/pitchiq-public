import { formatSeasonLabel } from "@/utils/season";

import type { RuleResult, TriviaRule } from "../types";

/** Minimum managers in one season to be notable. */
const MIN_MANAGERS = 3;

/** Join names: "A, B and C". */
function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

/** R21 — a club that churned through several managers in a single season (2008+). */
export const managerialMerryGoRoundRule: TriviaRule = {
  id: "R21",
  title: "Managerial merry-go-round",
  scopes: ["team"],
  async run(data, ctx): Promise<RuleResult | null> {
    if (ctx.scope !== "team" || ctx.id === undefined) return null;
    const id = ctx.id;
    const standings = await data.standings();
    const team = standings?.find((s) => s.teamId === id);
    if (!team) return null;
    const season = data.season;
    const list = (await data.managers())?.[String(season)]?.[String(id)];
    if (!list || list.length < MIN_MANAGERS) return null;
    const names = joinNames(list.map((m) => m.name));
    return {
      text: `${team.teamName} were managed by ${list.length} different men in ${formatSeasonLabel(season)} — ${names}.`,
      key: "factManagerialMerryGoRound",
      values: { team: team.teamName, count: list.length, season, names },
      sources: [{ kind: "standings", season, teamId: id }],
      async verify(d) {
        const l = (await d.managers())?.[String(season)]?.[String(id)];
        return !!l && l.length >= MIN_MANAGERS;
      },
    };
  },
};
