import type { Fixture } from "@/data/schemas";

/**
 * Build a team's recent-form string (e.g. "WWDLW") from a season's fixtures.
 *
 * Only completed matches (both scores non-null) count. The result is ordered
 * oldest-left / newest-right and capped at the last 5 — exactly what
 * `<FormChips>` expects (it renders `form.slice(-5)`). Returns `""` when the
 * team has no completed matches (renders as "—").
 *
 * Pure: no I/O, so it's unit-testable in isolation and reusable across seasons.
 */
export function synthesizeForm(fixtures: Fixture[], teamId: number): string {
  const played = fixtures
    .filter(
      (f) =>
        (f.homeTeamId === teamId || f.awayTeamId === teamId) &&
        f.homeScore !== null &&
        f.awayScore !== null,
    )
    .sort((a, b) => (a.date === b.date ? a.id.localeCompare(b.id) : a.date.localeCompare(b.date)));

  return played
    .slice(-5)
    .map((f) => {
      const isHome = f.homeTeamId === teamId;
      const own = (isHome ? f.homeScore : f.awayScore) as number;
      const opp = (isHome ? f.awayScore : f.homeScore) as number;
      if (own > opp) return "W";
      if (own < opp) return "L";
      return "D";
    })
    .join("");
}
