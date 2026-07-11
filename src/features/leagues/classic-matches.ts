import type { Fixture, Standing } from "@/data/schemas";

// TASK-M14 — "Classic Matches": rank a completed season's fixtures by a
// deterministic composite "notability/drama" score so the dashboard is
// compelling for HISTORICAL seasons too (where "recent" is meaningless).
//
// Pure function of the committed standings + fixtures + scores — NO external
// fame signal. Equal scores tie-break on fixture id, so the output is stable
// (byte-identical) across runs.
//
// Composite score per completed fixture (each component normalized 0-1):
//   Big-team clash  0.35  (2N − posHome − posAway) / 2N   (final table positions)
//   Goal fest       0.30  min(totalGoals, 8) / 8
//   High stakes     0.20  late-season AND a title (final top-2) or relegation
//                         (final bottom-4) side is involved
//   Comeback       +0.15  flat bonus — a side was losing at half-time but
//                         won/drew (needs committed halfTime; 0 when null)
//
// The base three sum to 0.85; comeback is a flat +0.15 bonus on top (max 1.0).
// Renormalizing the base to 1.0 would not change the ranking, only absolute
// scores — left as 0.85 + bonus to mirror the agreed matrix exactly.

/**
 * Contextual catalyst badge as a message KEY (in the `fixtures` namespace) plus
 * any interpolation params — resolved to a localized label at the render site
 * (TASK-1604). A pure module can't call `useTranslations`, so it never returns a
 * display string; `<ClassicMatchesRail>` does the `t(...)`.
 */
export type ClassicBadge = { key: string; total?: number };

export type ClassicMatch = {
  fixture: Fixture;
  score: number;
  /** Contextual catalyst badge descriptor (key + params), e.g. a goal thriller. */
  badge: ClassicBadge;
};

type Options = {
  limit?: number;
  maxPerClub?: number;
};

const W_BIG_TEAM = 0.35;
const W_GOAL_FEST = 0.3;
const W_HIGH_STAKES = 0.2;
const COMEBACK_BONUS = 0.15;

function isCompleted(f: Fixture): boolean {
  return f.homeScore !== null && f.awayScore !== null;
}

/**
 * Assign each fixture a "gameweek" = the higher of the two teams' chronological
 * match index (1-based). The PL plays teams roughly in lockstep, so a team's
 * Nth match ≈ matchweek N. Used to detect late-season matches without a
 * matchweek column in the data.
 */
function buildGameweeks(fixtures: readonly Fixture[]): Map<string, number> {
  const counts = new Map<number, number>();
  const result = new Map<string, number>();
  const ordered = [...fixtures].sort(
    (a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id),
  );
  for (const f of ordered) {
    const home = (counts.get(f.homeTeamId) ?? 0) + 1;
    const away = (counts.get(f.awayTeamId) ?? 0) + 1;
    counts.set(f.homeTeamId, home);
    counts.set(f.awayTeamId, away);
    result.set(f.id, Math.max(home, away));
  }
  return result;
}

function comebackHappened(f: Fixture): boolean {
  if (!f.halfTime || f.homeScore === null || f.awayScore === null) return false;
  const homeLosingHT = f.halfTime.home < f.halfTime.away;
  const awayLosingHT = f.halfTime.away < f.halfTime.home;
  const homeRecovered = homeLosingHT && f.homeScore >= f.awayScore;
  const awayRecovered = awayLosingHT && f.awayScore >= f.homeScore;
  return homeRecovered || awayRecovered;
}

type Ctx = {
  rankOf: (teamId: number) => number;
  n: number;
  lateThreshold: number;
  gameweeks: Map<string, number>;
};

function scoreFixture(f: Fixture, ctx: Ctx): number {
  const posHome = ctx.rankOf(f.homeTeamId);
  const posAway = ctx.rankOf(f.awayTeamId);
  const bigTeam = (2 * ctx.n - posHome - posAway) / (2 * ctx.n);

  const totalGoals = (f.homeScore ?? 0) + (f.awayScore ?? 0);
  const goalFest = Math.min(totalGoals, 8) / 8;

  const lateSeason = (ctx.gameweeks.get(f.id) ?? 0) >= ctx.lateThreshold;
  const titleSide = posHome <= 2 || posAway <= 2;
  const relegationSide = posHome > ctx.n - 4 || posAway > ctx.n - 4;
  const highStakes = lateSeason && (titleSide || relegationSide) ? 1 : 0;

  const comeback = comebackHappened(f) ? COMEBACK_BONUS : 0;

  return W_BIG_TEAM * bigTeam + W_GOAL_FEST * goalFest + W_HIGH_STAKES * highStakes + comeback;
}

function badgeFor(f: Fixture, ctx: Ctx): ClassicBadge {
  // Pick the most distinctive catalyst. A high-scoring game reads as a
  // thriller (the headline is the goals, even if it was also a comeback); a
  // lower-scoring game where a side recovered from a half-time deficit reads
  // as a comeback. Then late-season stakes, else a plain marquee clash. The
  // comeback term still boosts the *ranking* regardless of which label wins.
  const totalGoals = (f.homeScore ?? 0) + (f.awayScore ?? 0);
  if (totalGoals >= 5) return { key: "goalThriller", total: totalGoals };
  if (comebackHappened(f)) return { key: "badgeEpicComeback" };

  const posHome = ctx.rankOf(f.homeTeamId);
  const posAway = ctx.rankOf(f.awayTeamId);
  const lateSeason = (ctx.gameweeks.get(f.id) ?? 0) >= ctx.lateThreshold;
  const titleSide = posHome <= 2 || posAway <= 2;
  const relegationSide = posHome > ctx.n - 4 || posAway > ctx.n - 4;
  if (lateSeason && titleSide) return { key: "badgeTitleDecider" };
  if (lateSeason && relegationSide) return { key: "badgeRelegationBattle" };

  return { key: "badgeMarquee" };
}

/**
 * Rank a season's completed fixtures by the composite notability score and
 * return the top `limit` (default 6), with a **diversity guard** of at most
 * `maxPerClub` (default 2) matches per club so a dominant side can't
 * monopolize the rail. Deterministic: equal scores tie-break on fixture id.
 */
export function classicMatches(
  fixtures: readonly Fixture[],
  standings: readonly Standing[],
  opts: Options = {},
): ClassicMatch[] {
  const limit = opts.limit ?? 6;
  const maxPerClub = opts.maxPerClub ?? 2;

  const n = standings.length;
  if (n === 0) return [];

  const rankMap = new Map<number, number>();
  for (const s of standings) rankMap.set(s.teamId, s.rank);
  // A team missing from the table (shouldn't happen) ranks last so it never
  // inflates the big-team score.
  const rankOf = (teamId: number) => rankMap.get(teamId) ?? n;

  const ctx: Ctx = {
    rankOf,
    n,
    // 2*(N-1) matches per team (38 for N=20, 42 for N=22); "late" = last 5.
    lateThreshold: 2 * (n - 1) - 4,
    gameweeks: buildGameweeks(fixtures),
  };

  const ranked = fixtures
    .filter(isCompleted)
    .map((fixture) => ({ fixture, score: scoreFixture(fixture, ctx) }))
    .sort((a, b) => b.score - a.score || a.fixture.id.localeCompare(b.fixture.id));

  const perClub = new Map<number, number>();
  const picks: ClassicMatch[] = [];
  for (const { fixture, score } of ranked) {
    if (picks.length >= limit) break;
    const homeCount = perClub.get(fixture.homeTeamId) ?? 0;
    const awayCount = perClub.get(fixture.awayTeamId) ?? 0;
    if (homeCount >= maxPerClub || awayCount >= maxPerClub) continue;
    perClub.set(fixture.homeTeamId, homeCount + 1);
    perClub.set(fixture.awayTeamId, awayCount + 1);
    picks.push({ fixture, score, badge: badgeFor(fixture, ctx) });
  }
  return picks;
}
