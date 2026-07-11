import type { Fixture, Standing } from "@/data/schemas";
import type { RuleResult, TriviaData, TriviaRule } from "../types";

/** Worth surfacing only from this many games unbeaten. */
const MIN_STREAK = 3;

/** A team's current trailing run of games without a loss (most-recent backwards). */
function currentUnbeaten(fixtures: Fixture[], teamId: number): number {
  const played = fixtures
    .filter(
      (f) =>
        f.homeScore !== null &&
        f.awayScore !== null &&
        (f.homeTeamId === teamId || f.awayTeamId === teamId),
    )
    .sort((a, b) => (a.date !== b.date ? (a.date < b.date ? 1 : -1) : a.id < b.id ? 1 : -1));
  let run = 0;
  for (const f of played) {
    const gf = f.homeTeamId === teamId ? f.homeScore! : f.awayScore!;
    const ga = f.homeTeamId === teamId ? f.awayScore! : f.homeScore!;
    if (gf < ga) break; // a loss ends the current run
    run++;
  }
  return run;
}

/** League-wide longest current unbeaten run (max run, lowest teamId breaks ties). */
function longestUnbeaten(standings: Standing[], fixtures: Fixture[]) {
  let best: { teamId: number; name: string; run: number } | null = null;
  for (const s of standings) {
    const run = currentUnbeaten(fixtures, s.teamId);
    if (!best || run > best.run) best = { teamId: s.teamId, name: s.teamName, run };
  }
  return best;
}

/** R10 — Streaks: the team on the longest current unbeaten run. */
export const streakRule: TriviaRule = {
  id: "R10",
  title: "Longest unbeaten run",
  scopes: ["league", "team"],
  async run(data, ctx): Promise<RuleResult | null> {
    const [standings, fixtures] = [await data.standings(), await data.fixtures()];
    if (!standings || !fixtures) return null;

    if (ctx.scope === "team") {
      if (ctx.id === undefined) return null;
      const team = standings.find((s) => s.teamId === ctx.id);
      if (!team) return null;
      const run = currentUnbeaten(fixtures, ctx.id);
      if (run < MIN_STREAK) return null;
      return {
        text: `${team.teamName} are unbeaten in their last ${run} matches.`,
        key: "factStreakTeam",
        values: { team: team.teamName, run },
        sources: [{ kind: "fixtures", season: data.season }],
        async verify(d: TriviaData) {
          const f = await d.fixtures();
          return f !== null && currentUnbeaten(f, ctx.id!) === run;
        },
      };
    }

    const best = longestUnbeaten(standings, fixtures);
    if (!best || best.run < MIN_STREAK) return null;
    return {
      text: `${best.name} are on the longest current unbeaten run in the league (${best.run} matches).`,
      key: "factStreakLeague",
      values: { name: best.name, run: best.run },
      sources: [{ kind: "fixtures", season: data.season }],
      async verify(d: TriviaData) {
        const [s, f] = [await d.standings(), await d.fixtures()];
        if (!s || !f) return false;
        const b = longestUnbeaten(s, f);
        return b !== null && b.teamId === best.teamId && b.run === best.run;
      },
    };
  },
};
