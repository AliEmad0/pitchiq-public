import "server-only";

import { getEntityNames } from "@/features/i18n/entity-names";

import { loadClubLogos, loadFixtures, loadStandings } from "@/data/loaders";
import { PREMIER_LEAGUE_ID, standingsTag } from "@/utils/cache-tags";
import { clubLogoFromMap } from "@/utils/club-logo";
import { logger } from "@/utils/logger";
import type { LeagueStandings, StandingsRow } from "@/types/api";

import { synthesizeForm } from "./form";

// Re-exported from `src/utils/cache-tags.ts` (which owns the constant to
// avoid a circular import with the tag helpers below).
export { PREMIER_LEAGUE_ID };

type GetStandingsArgs = { league?: number; season: number };

/**
 * Per-season actual European qualification + relegation outcomes by team.
 *
 * **Why hand-curated, not rank-derived?** Real PL European qualification has
 * too many edge cases for a simple rank → competition mapping:
 *
 *   - **UEFA "European Performance Spot"**: in 2024-25, England received a
 *     5th Champions League spot (Swiss-format CL launch; top-2 coefficient
 *     countries get a bonus slot). Rank 5 (Newcastle) went to CL, not UEL.
 *   - **Domestic cup winners cascade**: FA Cup winner gets a UEFA spot
 *     (Conference League by default). If they're already qualified via
 *     league finish, the spot cascades down. In 2024-25, Crystal Palace
 *     finished **12th** but won the FA Cup → got the UECL spot. Newcastle's
 *     EFL Cup win didn't cascade further because they were already in CL.
 *   - **UEFA Cup → Europa League rename (2009)**, **Conference League
 *     introduction (2021-22)**, **Cup Winners' Cup abolition (1999)** all
 *     mean older seasons have entirely different competition structures.
 *
 * Hand-curating per season is the only honest approach for a portfolio app —
 * the alternative (encoding every FA Cup / EFL Cup / coefficient rule
 * generically) is a research project, not a feature.
 *
 * **Source of truth**: the official PL final-standings + UEFA's allocation
 * list at season end (researched + verified against public records for every
 * committed season).
 *
 * **Era-accurate labels (TASK-M04):** the bucket → competition mapping changed
 * over time, so `descriptionForTeam` renders era-correct names — `europaLeague`
 * is the "UEFA Cup" pre-2009, the "Europa League" after; `conferenceLeague` is
 * the "Cup Winners' Cup" pre-1999 (and empty 1999-2020, before the Conference
 * League launched in 2021-22). The four color buckets are unchanged.
 */
type SeasonQualification = {
  /** Teams qualifying for the Champions League (group stage / Swiss league phase). */
  championsLeague: readonly number[];
  /** Teams qualifying for the Europa League. */
  europaLeague: readonly number[];
  /** Teams qualifying for the Conference League. */
  conferenceLeague: readonly number[];
  /** Teams relegated to the second tier (Championship / Division One). */
  relegation: readonly number[];
};

const QUALIFICATION_BY_SEASON: Record<number, SeasonQualification> = {
  // 1993-94 → 2023-24, researched + verified against public records
  // (champion ∈ championsLeague, every qualifier present in that season's table,
  // relegation = bottom-N of the committed standings). Bucket → competition is
  // era-dependent (see `descriptionForTeam`): europaLeague = UEFA Cup pre-2009;
  // conferenceLeague = Cup Winners' Cup pre-1999 (empty 1999-2020). Relegated
  // cup-winners (Birmingham 2010-11, Wigan 2012-13) also appear in europaLeague
  // but render as relegated (relegation takes precedence in the row color).
  // 1992-93 — the inaugural PL season (TASK-1403), web-verified + cross-checked
  // against standings-1992.json. England's 1993-94 places: 1 European Cup, 2 UEFA
  // Cup, 1 Cup Winners' Cup. Arsenal double-won (FA + League Cup) → took CWC via the
  // FA Cup, so the League Cup's UEFA berth reverted to the league → Norwich (3rd).
  1992: {
    championsLeague: [33], // Manchester United (champions)
    europaLeague: [66, 71], // Aston Villa (2nd) + Norwich City (3rd) → UEFA Cup
    conferenceLeague: [42], // Arsenal (1993 FA Cup winners) → Cup Winners' Cup
    relegation: [52, 70, 65], // Crystal Palace, Middlesbrough, Nottingham Forest
  },
  1993: {
    championsLeague: [33],
    europaLeague: [67, 34, 66],
    conferenceLeague: [42, 49],
    relegation: [62, 1349, 1353],
  },
  1994: {
    championsLeague: [67],
    europaLeague: [33, 65, 40, 63],
    conferenceLeague: [45],
    relegation: [52, 71, 46, 57],
  },
  1995: {
    championsLeague: [33],
    europaLeague: [34, 66, 42],
    conferenceLeague: [40],
    relegation: [50, 72, 68],
  },
  1996: {
    championsLeague: [33, 34],
    europaLeague: [42, 40, 66, 46],
    conferenceLeague: [49],
    relegation: [1346, 746, 65],
  },
  1997: {
    championsLeague: [42, 33],
    europaLeague: [40, 63, 66, 67],
    conferenceLeague: [49, 34],
    relegation: [68, 747, 52],
  },
  1998: {
    championsLeague: [33, 42, 49],
    europaLeague: [63, 48, 47, 34],
    conferenceLeague: [],
    relegation: [1335, 67, 65],
  },
  1999: {
    championsLeague: [33, 42, 63],
    europaLeague: [40, 49, 46, 66, 1343],
    conferenceLeague: [],
    relegation: [1333, 74, 38],
  },
  2000: {
    championsLeague: [33, 42, 40],
    europaLeague: [63, 57, 49, 66],
    conferenceLeague: [],
    relegation: [50, 1346, 1343],
  },
  2001: {
    championsLeague: [42, 40, 33, 34],
    europaLeague: [63, 49, 67, 57, 66, 36],
    conferenceLeague: [],
    relegation: [57, 69, 46],
  },
  2002: {
    championsLeague: [33, 42, 34, 49],
    europaLeague: [40, 67, 41, 50],
    conferenceLeague: [],
    relegation: [48, 60, 746],
  },
  2003: {
    championsLeague: [42, 49, 33, 40],
    europaLeague: [34, 70],
    conferenceLeague: [],
    relegation: [46, 63, 39],
  },
  2004: {
    championsLeague: [49, 42, 33, 45, 40],
    europaLeague: [68, 70, 34],
    conferenceLeague: [],
    relegation: [52, 71, 41],
  },
  2005: {
    championsLeague: [49, 33, 40, 42],
    europaLeague: [47, 67, 48, 34],
    conferenceLeague: [],
    relegation: [54, 60, 746],
  },
  2006: {
    championsLeague: [33, 49, 40, 42],
    europaLeague: [47, 45, 68, 67],
    conferenceLeague: [],
    relegation: [62, 1335, 38],
  },
  2007: {
    championsLeague: [33, 49, 42, 40],
    europaLeague: [1355, 47, 45, 66, 50],
    conferenceLeague: [],
    relegation: [53, 54, 69],
  },
  2008: {
    championsLeague: [33, 40, 49, 42],
    europaLeague: [45, 66, 36],
    conferenceLeague: [],
    relegation: [34, 70, 60],
  },
  2009: {
    championsLeague: [49, 33, 42, 47],
    europaLeague: [50, 66, 40],
    conferenceLeague: [],
    relegation: [44, 64, 1355],
  },
  2010: {
    championsLeague: [33, 49, 50, 42],
    europaLeague: [47, 54, 75, 36],
    conferenceLeague: [],
    relegation: [54, 1356, 48],
  },
  2011: {
    championsLeague: [50, 33, 42, 49],
    europaLeague: [47, 34, 40],
    conferenceLeague: [],
    relegation: [68, 67, 39],
  },
  2012: {
    championsLeague: [33, 50, 49, 42],
    europaLeague: [47, 61, 76],
    conferenceLeague: [],
    relegation: [61, 53, 72],
  },
  2013: {
    championsLeague: [50, 40, 49, 42],
    europaLeague: [45, 47, 64],
    conferenceLeague: [],
    relegation: [71, 36, 43],
  },
  2014: {
    championsLeague: [49, 50, 42, 33],
    europaLeague: [47, 40, 41, 48],
    conferenceLeague: [],
    relegation: [64, 44, 72],
  },
  2015: {
    championsLeague: [46, 42, 47, 50],
    europaLeague: [33, 41, 48],
    conferenceLeague: [],
    relegation: [34, 71, 66],
  },
  2016: {
    championsLeague: [49, 47, 50, 40, 33],
    europaLeague: [42, 45],
    conferenceLeague: [],
    relegation: [64, 70, 746],
  },
  2017: {
    championsLeague: [50, 33, 47, 40],
    europaLeague: [49, 42, 44],
    conferenceLeague: [],
    relegation: [76, 75, 60],
  },
  2018: {
    championsLeague: [50, 40, 49, 47],
    europaLeague: [42, 33, 39],
    conferenceLeague: [],
    relegation: [43, 36, 37],
  },
  2019: {
    championsLeague: [40, 50, 33, 49],
    europaLeague: [46, 47, 42],
    conferenceLeague: [],
    relegation: [35, 38, 71],
  },
  2020: {
    championsLeague: [50, 33, 40, 49],
    europaLeague: [46, 48],
    conferenceLeague: [47],
    relegation: [36, 60, 62],
  },
  2021: {
    championsLeague: [50, 40, 49, 47],
    europaLeague: [42, 33],
    conferenceLeague: [48],
    relegation: [44, 38, 71],
  },
  2022: {
    championsLeague: [50, 42, 33, 34],
    europaLeague: [40, 51, 48],
    conferenceLeague: [66],
    relegation: [46, 63, 41],
  },
  2023: {
    championsLeague: [50, 42, 40, 66],
    europaLeague: [47, 33],
    conferenceLeague: [49],
    relegation: [1359, 44, 62],
  },

  // 2024-25 final outcome (verified against the official PL broadcast graphic).
  // England earned a 5th CL spot via UEFA's European Performance Spot rule
  // (top-2 coefficient countries for the 2024-25 Swiss-format CL launch).
  // Crystal Palace (rank 12) qualified for UECL by winning the FA Cup —
  // Newcastle's EFL Cup win didn't cascade because Newcastle was already in CL.
  2024: {
    championsLeague: [
      40, // Liverpool (rank 1, champions)
      42, // Arsenal (rank 2)
      50, // Manchester City (rank 3)
      49, // Chelsea (rank 4)
      34, // Newcastle United (rank 5 — 5th CL spot via coefficient)
    ],
    europaLeague: [
      66, // Aston Villa (rank 6)
      65, // Nottingham Forest (rank 7)
    ],
    conferenceLeague: [
      52, // Crystal Palace (rank 12 — FA Cup winner)
    ],
    relegation: [
      46, // Leicester City (rank 18)
      57, // Ipswich Town (rank 19)
      41, // Southampton (rank 20)
    ],
  },

  // 2025-26 final outcome (verified via web research + cross-checked against the
  // committed standings; user-confirmed). England kept its 5th CL spot via the
  // UEFA European Performance Spot, so the top 5 all go to the Champions League.
  // Both domestic cups (FA Cup + Carabao Cup) were won by Manchester City, who
  // already qualified via league (2nd) — so no cup cascade. Crystal Palace
  // finished 15th but won the 2025-26 UEFA Conference League, earning a Europa
  // League berth; Brighton (8th) takes the Conference League play-off spot.
  2025: {
    championsLeague: [
      42, // Arsenal (rank 1, champions)
      50, // Manchester City (rank 2)
      33, // Manchester United (rank 3)
      66, // Aston Villa (rank 4)
      40, // Liverpool (rank 5 — 5th CL spot via European Performance Spot)
    ],
    europaLeague: [
      35, // AFC Bournemouth (rank 6)
      746, // Sunderland (rank 7)
      52, // Crystal Palace (rank 15 — 2025-26 Conference League winners)
    ],
    conferenceLeague: [
      51, // Brighton & Hove Albion (rank 8 — Conference League play-off round)
    ],
    relegation: [
      48, // West Ham United (rank 18)
      44, // Burnley (rank 19)
      39, // Wolverhampton Wanderers (rank 20)
    ],
  },
};

/**
 * Resolve a team's European qualification or relegation status for a given
 * season. Returns the api-football-style `description` string that
 * `StandingsTable`'s `getQualificationStyle()` regex-matches to apply the
 * row tint + left-border accent (TASK-607).
 *
 * Returns `null` for mid-table teams (no qualification implication) AND for
 * any season not yet in `QUALIFICATION_BY_SEASON` — until Phase 7/8 encode
 * their per-team maps, historical seasons render the neutral zebra-stripe
 * instead of incorrect colors.
 *
 * Return strings must match the `QUALIFICATION_STYLES` regexes in
 * `src/features/leagues/components/StandingsTable.tsx` — keep them in sync.
 */
/** Europa-tier competition name for the era (UEFA Cup was renamed in 2009). */
function europaLabel(season: number): string {
  return season <= 2008 ? "UEFA Cup" : "Europa League";
}

/** Third-tier competition name for the era (Cup Winners' Cup ended 1999; UECL from 2021). */
function conferenceLabel(season: number): string {
  return season <= 1998 ? "Cup Winners' Cup" : "Conference League";
}

export function descriptionForTeam(teamId: number, season: number): string | null {
  const map = QUALIFICATION_BY_SEASON[season];
  if (!map) return null;
  // Relegation takes precedence: the only overlaps are relegated cup-winners
  // (Birmingham 2010-11, Wigan 2012-13) who also qualified for Europe — they sit
  // at the bottom of the table, so the red relegation tint reads correctly.
  if (map.relegation.includes(teamId)) return "Relegation - Championship";
  if (map.championsLeague.includes(teamId)) return "Promotion - Champions League (Group Stage)";
  if (map.europaLeague.includes(teamId)) return `Promotion - ${europaLabel(season)}`;
  if (map.conferenceLeague.includes(teamId)) return `Promotion - ${conferenceLabel(season)}`;
  return null;
}

/**
 * Return the Premier League standings as a `LeagueStandings` envelope,
 * sourced from the committed JSON snapshot for the given season.
 *
 * The standings snapshot does not carry home/away splits, form strings, or
 * qualification descriptions:
 *   - `form`         → synthesized from this season's fixtures via synthesizeForm
 *                       (last-5 W/D/L; "" when no completed matches → renders "—")
 *   - `description`  → resolved via `descriptionForTeam(teamId, season)` against
 *                       the hand-curated per-season qualification map
 *   - `home/away.*`  → not read by any current consumer (confirmed)
 *
 * The `league` parameter is accepted for API compatibility but ignored —
 * the loader always reads the PL dataset.
 */
export async function getStandings({
  league = PREMIER_LEAGUE_ID,
  season,
}: GetStandingsArgs): Promise<LeagueStandings | null> {
  void league; // accepted for signature compat; loader is PL-only

  // standingsTag is used here only for logging / future cache-bust wiring.
  // The loader reads from fs — no HTTP cache tags are set.
  const tag = standingsTag(season);

  const rows = await loadStandings(season);

  if (!rows) {
    logger.warn("standings.load_failed", { season, tag });
    return null;
  }

  // Form is synthesized from this season's fixtures (the standings JSON carries
  // no form string). Missing fixtures → [] → every form is "" → renders "—".
  const fixtures = (await loadFixtures(season)) ?? [];
  const clubLogos = await loadClubLogos();
  const names = await getEntityNames();

  const emptyHalf = {
    played: 0,
    win: 0,
    draw: 0,
    lose: 0,
    goals: { for: 0, against: 0 },
  } as const;

  const standingsRows: StandingsRow[] = rows.map((s) => ({
    rank: s.rank,
    team: {
      id: s.teamId,
      name: names.team(s.teamId, s.teamName),
      logo: clubLogoFromMap(s.teamId, season, clubLogos),
    },
    points: s.points,
    goalsDiff: s.goalsDiff,
    group: "Premier League",
    form: synthesizeForm(fixtures, s.teamId),
    status: "same",
    description: descriptionForTeam(s.teamId, season),
    all: {
      played: s.played,
      win: s.won,
      draw: s.drawn,
      lose: s.lost,
      goals: { for: s.goalsFor, against: s.goalsAgainst },
    },
    home: { ...emptyHalf },
    away: { ...emptyHalf },
    update: "",
  }));

  return {
    league: {
      id: PREMIER_LEAGUE_ID,
      name: "Premier League",
      country: "England",
      logo: "",
      flag: "",
      season,
      standings: [standingsRows],
    },
  };
}
