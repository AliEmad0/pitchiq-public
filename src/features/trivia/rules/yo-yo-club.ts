import type { RuleResult, TriviaData, TriviaRule } from "../types";

/** Minimum relegations to be a notable "yo-yo club". */
const MIN_RELEGATIONS = 3;

/** Count seasons where the club is present but absent from the next committed season. */
async function relegations(
  data: TriviaData,
  teamId: number,
): Promise<{ count: number; name: string }> {
  const seasons = [...(await data.seasons())].sort((a, b) => a - b); // ascending
  const present = new Map<number, string | null>();
  for (const s of seasons) {
    const row = (await data.standings(s))?.find((x) => x.teamId === teamId);
    present.set(s, row ? row.teamName : null);
  }
  let count = 0;
  let name = "";
  for (let i = 0; i < seasons.length - 1; i++) {
    const here = present.get(seasons[i]);
    const next = present.get(seasons[i + 1]);
    if (here != null) name = here;
    if (here != null && next == null) count++;
  }
  return { count, name };
}

/** R22 — a club relegated from the Premier League multiple times (cross-season). */
export const yoYoClubRule: TriviaRule = {
  id: "R22",
  title: "Yo-yo club",
  scopes: ["team"],
  async run(data, ctx): Promise<RuleResult | null> {
    if (ctx.scope !== "team" || ctx.id === undefined) return null;
    const id = ctx.id;
    const { count, name } = await relegations(data, id);
    if (count < MIN_RELEGATIONS || !name) return null;
    return {
      text: `${name} have been relegated from the Premier League ${count} times — one of the league's classic yo-yo clubs.`,
      key: "factYoYoClub",
      values: { name, count },
      sources: [{ kind: "standings", season: data.season, teamId: id }],
      async verify(d) {
        const r = await relegations(d, id);
        return r.count === count && r.count >= MIN_RELEGATIONS;
      },
    };
  },
};
