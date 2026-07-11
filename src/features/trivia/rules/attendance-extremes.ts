import type { Fixture, FixtureExtrasFile } from "@/data/schemas";
import { formatSeasonLabel } from "@/utils/season";

import type { RuleResult, TriviaRule } from "../types";

/** The fixture id with the highest attendance (ties → lowest id), or null. */
function maxAttendance(
  extras: FixtureExtrasFile,
): { id: string; attendance: number; venue: string | null } | null {
  let best: { id: string; attendance: number; venue: string | null } | null = null;
  for (const [id, e] of Object.entries(extras)) {
    if (e.attendance === null) continue;
    if (
      best === null ||
      e.attendance > best.attendance ||
      (e.attendance === best.attendance && id < best.id)
    ) {
      best = { id, attendance: e.attendance, venue: e.venue };
    }
  }
  return best;
}

/** R23 — the biggest league crowd of the season. */
export const attendanceExtremesRule: TriviaRule = {
  id: "R23",
  title: "Attendance extremes",
  scopes: ["league"],
  async run(data): Promise<RuleResult | null> {
    const [extras, fixtures] = [await data.fixtureExtras(), await data.fixtures()];
    if (!extras || !fixtures) return null;
    const top = maxAttendance(extras);
    if (!top) return null;
    const fx: Fixture | undefined = fixtures.find((f) => f.id === top.id);
    if (!fx) return null;
    const venue = top.venue ?? fx.venue;
    const season = data.season;
    return {
      text: `The biggest crowd in ${formatSeasonLabel(season)} was ${top.attendance.toLocaleString("en-GB")} for ${fx.homeTeamName} vs ${fx.awayTeamName} at ${venue}.`,
      key: "factAttendance",
      values: {
        season,
        attendance: top.attendance,
        home: fx.homeTeamName,
        away: fx.awayTeamName,
        venue,
      },
      sources: [{ kind: "fixtures", season, fixtureId: top.id }],
      async verify(d) {
        const e = await d.fixtureExtras();
        if (!e) return false;
        const t = maxAttendance(e);
        return !!t && t.id === top.id && t.attendance === top.attendance;
      },
    };
  },
};
