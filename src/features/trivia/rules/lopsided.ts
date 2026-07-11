import type { Fixture } from "@/data/schemas";
import type { RuleResult, TriviaRule } from "../types";

type Decisive = { fixture: Fixture; margin: number };

/** The most lopsided completed (non-draw) fixture, or null. Deterministic. */
function biggestWin(fixtures: Fixture[]): Decisive | null {
  const decisive = fixtures
    .filter((f) => f.homeScore !== null && f.awayScore !== null && f.homeScore !== f.awayScore)
    .map((f) => ({ fixture: f, margin: Math.abs(f.homeScore! - f.awayScore!) }));
  if (decisive.length === 0) return null;
  decisive.sort((a, b) => {
    if (b.margin !== a.margin) return b.margin - a.margin;
    const tg = (d: Decisive) => d.fixture.homeScore! + d.fixture.awayScore!;
    if (tg(b) !== tg(a)) return tg(b) - tg(a); // higher-scoring is more striking
    if (a.fixture.date !== b.fixture.date) return a.fixture.date < b.fixture.date ? -1 : 1;
    return a.fixture.id < b.fixture.id ? -1 : 1;
  });
  return decisive[0];
}

/** R7 — Lopsided fixtures: the biggest win of the season. */
export const lopsidedRule: TriviaRule = {
  id: "R7",
  title: "Biggest win",
  scopes: ["league"],
  async run(data): Promise<RuleResult | null> {
    const fixtures = await data.fixtures();
    if (!fixtures) return null;
    const top = biggestWin(fixtures);
    if (!top) return null;
    const f = top.fixture;
    return {
      text: `The biggest win of the season so far was ${f.homeTeamName} ${f.homeScore}–${f.awayScore} ${f.awayTeamName}.`,
      key: "factLopsided",
      values: {
        home: f.homeTeamName,
        away: f.awayTeamName,
        // biggestWin only considers completed fixtures, so scores are non-null;
        // `?? 0` keeps the value type `number` (never triggers).
        homeScore: f.homeScore ?? 0,
        awayScore: f.awayScore ?? 0,
      },
      sources: [{ kind: "fixtures", season: data.season, fixtureId: f.id }],
      async verify(d) {
        const fs = await d.fixtures();
        if (!fs) return false;
        const t = biggestWin(fs);
        return t !== null && t.fixture.id === f.id && t.margin === top.margin;
      },
    };
  },
};
