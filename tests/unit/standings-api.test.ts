/**
 * Tests for `src/features/leagues/api.ts` — post TASK-505 snapshot migration.
 *
 * `getStandings` now reads from committed JSON snapshots via `loadStandings`
 * (src/data/loaders.ts) rather than hitting wire over HTTP.
 * These tests exercise the adapter layer — they verify that `getStandings`
 * correctly wraps the flat `Standing[]` array into the `LeagueStandings`
 * envelope that all downstream consumers (StandingsTable, route handler, etc.)
 * expect.
 *
 * The committed `data/standings-2024.json` file is the live source of truth.
 * Liverpool rank 1, 84 pts; Southampton rank 20, 12 pts (2024-25 final table).
 */
import { describe, expect, it } from "vitest";

import { descriptionForTeam, getStandings, PREMIER_LEAGUE_ID } from "@/features/leagues/api";

describe("getStandings — snapshot adapter", () => {
  it("returns a non-null LeagueStandings envelope for season 2024", async () => {
    const result = await getStandings({ season: 2024 });

    expect(result).not.toBeNull();
    expect(result!.league.id).toBe(PREMIER_LEAGUE_ID);
    expect(result!.league.name).toBe("Premier League");
    expect(result!.league.season).toBe(2024);
  });

  it("wraps the rows in a nested standings array (standings[0] is the table)", async () => {
    const result = await getStandings({ season: 2024 });

    const table = result!.league.standings[0];
    expect(Array.isArray(table)).toBe(true);
    expect(table).toHaveLength(20);
  });

  it("preserves rank ordering — rank 1 is Liverpool with 84 points", async () => {
    const result = await getStandings({ season: 2024 });

    const table = result!.league.standings[0];
    expect(table[0].rank).toBe(1);
    expect(table[0].team.name).toBe("Liverpool");
    expect(table[0].points).toBe(84);
  });

  it("rank 20 is Southampton with 12 points", async () => {
    const result = await getStandings({ season: 2024 });

    const table = result!.league.standings[0];
    const last = table[19];
    expect(last.rank).toBe(20);
    expect(last.team.name).toBe("Southampton");
    expect(last.points).toBe(12);
  });

  it("synthesizes StandingsRow fields that snapshot doesn't carry", async () => {
    const result = await getStandings({ season: 2024 });

    const row = result!.league.standings[0][0];
    // form is now synthesized from fixtures — Liverpool played all 38 matches,
    // so the strip is exactly 5 valid W/D/L chars (newest right-most).
    expect(row.form).toMatch(/^[WDL]{5}$/);
    // home/away splits are synthesized as zeros
    expect(row.home.win).toBe(0);
    expect(row.away.win).toBe(0);
    expect(row.update).toBe("");
  });

  it("resolves description per the actual 2024-25 qualification outcome", async () => {
    const result = await getStandings({ season: 2024 });
    const table = result!.league.standings[0];
    const byTeamName = (name: string) => table.find((r) => r.team.name === name)!;

    // CL — 5 teams (England earned a 5th spot via UEFA coefficient).
    expect(byTeamName("Liverpool").description).toBe("Promotion - Champions League (Group Stage)");
    expect(byTeamName("Arsenal").description).toBe("Promotion - Champions League (Group Stage)");
    expect(byTeamName("Manchester City").description).toBe(
      "Promotion - Champions League (Group Stage)",
    );
    expect(byTeamName("Chelsea").description).toBe("Promotion - Champions League (Group Stage)");
    expect(byTeamName("Newcastle United").description).toBe(
      "Promotion - Champions League (Group Stage)",
    );

    // UEL — 2 teams.
    expect(byTeamName("Aston Villa").description).toBe("Promotion - Europa League");
    expect(byTeamName("Nottingham Forest").description).toBe("Promotion - Europa League");

    // UECL — Crystal Palace finished 12th but won the FA Cup.
    const palace = byTeamName("Crystal Palace");
    expect(palace.rank).toBe(12);
    expect(palace.description).toBe("Promotion - Conference League");

    // Relegation — 3 teams.
    expect(byTeamName("Leicester City").description).toBe("Relegation - Championship");
    expect(byTeamName("Ipswich Town").description).toBe("Relegation - Championship");
    expect(byTeamName("Southampton").description).toBe("Relegation - Championship");

    // Mid-table teams (not in any UEFA / relegation slot) → null.
    expect(byTeamName("Brighton & Hove Albion").description).toBeNull(); // rank 8
    expect(byTeamName("Tottenham Hotspur").description).toBeNull(); // rank 17
  });

  it("maps team logo to /logos/{teamId}.png", async () => {
    const result = await getStandings({ season: 2024 });

    const row = result!.league.standings[0][0]; // Liverpool, teamId 40
    expect(row.team.logo).toBe(`/logos/${row.team.id}.png`);
  });

  it("maps all.win/draw/lose/goals correctly from snapshot columns", async () => {
    const result = await getStandings({ season: 2024 });

    // Liverpool 2024-25: W25 D9 L4, GF86 GA41
    const liverpool = result!.league.standings[0].find((r) => r.team.name === "Liverpool");
    expect(liverpool).toBeDefined();
    expect(liverpool!.all.win).toBe(25);
    expect(liverpool!.all.draw).toBe(9);
    expect(liverpool!.all.lose).toBe(4);
    expect(liverpool!.all.goals.for).toBe(86);
    expect(liverpool!.all.goals.against).toBe(41);
    expect(liverpool!.goalsDiff).toBe(45);
    expect(liverpool!.all.played).toBe(38);
  });

  it("returns null for a season with no committed snapshot", async () => {
    const result = await getStandings({ season: 2099 });

    expect(result).toBeNull();
  });

  it("re-exports PREMIER_LEAGUE_ID = 39 for back-compat", () => {
    expect(PREMIER_LEAGUE_ID).toBe(39);
  });

  it("synthesizes a form strip for every team in a completed season", async () => {
    const result = await getStandings({ season: 2024 });
    const table = result!.league.standings[0];
    // All 20 teams completed 38 matches in 2024-25 → each form is exactly 5 chars.
    for (const row of table) {
      expect(row.form, `team ${row.team.name}`).toMatch(/^[WDL]{5}$/);
    }
  });
});

describe("descriptionForTeam — 2024-25 actual outcome", () => {
  // The map is hand-curated to match the official PL broadcast graphic + UEFA
  // allocation. Tests pin every team that earned a UEFA spot or got relegated.

  it("CL: 5 teams (Liverpool, Arsenal, Man City, Chelsea, Newcastle — 5th spot via coefficient)", () => {
    const cl = "Promotion - Champions League (Group Stage)";
    expect(descriptionForTeam(40, 2024)).toBe(cl); // Liverpool
    expect(descriptionForTeam(42, 2024)).toBe(cl); // Arsenal
    expect(descriptionForTeam(50, 2024)).toBe(cl); // Manchester City
    expect(descriptionForTeam(49, 2024)).toBe(cl); // Chelsea
    expect(descriptionForTeam(34, 2024)).toBe(cl); // Newcastle (5th spot)
  });

  it("UEL: 2 teams (Aston Villa, Nottm Forest)", () => {
    expect(descriptionForTeam(66, 2024)).toBe("Promotion - Europa League"); // Aston Villa
    expect(descriptionForTeam(65, 2024)).toBe("Promotion - Europa League"); // Nottm Forest
  });

  it("UECL: Crystal Palace (rank 12, FA Cup winner — displaces the rank-6 default)", () => {
    expect(descriptionForTeam(52, 2024)).toBe("Promotion - Conference League"); // Crystal Palace
  });

  it("Relegation: 3 teams (Leicester, Ipswich, Southampton)", () => {
    expect(descriptionForTeam(46, 2024)).toBe("Relegation - Championship"); // Leicester
    expect(descriptionForTeam(57, 2024)).toBe("Relegation - Championship"); // Ipswich
    expect(descriptionForTeam(41, 2024)).toBe("Relegation - Championship"); // Southampton
  });

  it("mid-table teams (not in any UEFA / relegation slot) → null", () => {
    // Brighton (rank 8) — closest to UEFA but didn't qualify
    expect(descriptionForTeam(51, 2024)).toBeNull();
    // Tottenham (rank 17) — escaped relegation by 1 spot
    expect(descriptionForTeam(47, 2024)).toBeNull();
    // Bournemouth (rank 9)
    expect(descriptionForTeam(35, 2024)).toBeNull();
    // Brentford (rank 10)
    expect(descriptionForTeam(55, 2024)).toBeNull();
  });

  it("unknown teamId in a known season → null (no crash)", () => {
    expect(descriptionForTeam(99999, 2024)).toBeNull();
  });
});

describe("descriptionForTeam — 2025-26 actual outcome", () => {
  // Verified via web research + cross-checked against data/standings-2025.json
  // (user-confirmed). Modern era → "Champions League" / "Europa League" /
  // "Conference League" labels.
  it("CL: 5 teams (Arsenal, Man City, Man Utd, Aston Villa, Liverpool — 5th spot via EPS)", () => {
    const cl = "Promotion - Champions League (Group Stage)";
    expect(descriptionForTeam(42, 2025)).toBe(cl); // Arsenal (champions)
    expect(descriptionForTeam(50, 2025)).toBe(cl); // Manchester City
    expect(descriptionForTeam(33, 2025)).toBe(cl); // Manchester United
    expect(descriptionForTeam(66, 2025)).toBe(cl); // Aston Villa
    expect(descriptionForTeam(40, 2025)).toBe(cl); // Liverpool (5th, EPS spot)
  });

  it("UEL: 3 teams (Bournemouth, Sunderland, Crystal Palace as UECL winners)", () => {
    const el = "Promotion - Europa League";
    expect(descriptionForTeam(35, 2025)).toBe(el); // Bournemouth (6th)
    expect(descriptionForTeam(746, 2025)).toBe(el); // Sunderland (7th)
    expect(descriptionForTeam(52, 2025)).toBe(el); // Crystal Palace (15th, won UECL)
  });

  it("UECL: Brighton (8th — Conference League play-off round)", () => {
    expect(descriptionForTeam(51, 2025)).toBe("Promotion - Conference League"); // Brighton
  });

  it("Relegation: 3 teams (West Ham, Burnley, Wolves)", () => {
    const rel = "Relegation - Championship";
    expect(descriptionForTeam(48, 2025)).toBe(rel); // West Ham (18th)
    expect(descriptionForTeam(44, 2025)).toBe(rel); // Burnley (19th)
    expect(descriptionForTeam(39, 2025)).toBe(rel); // Wolves (20th)
  });

  it("mid-table teams → null", () => {
    expect(descriptionForTeam(55, 2025)).toBeNull(); // Brentford (9th)
    expect(descriptionForTeam(49, 2025)).toBeNull(); // Chelsea (10th)
    expect(descriptionForTeam(47, 2025)).toBeNull(); // Tottenham (17th)
  });
});

describe("descriptionForTeam — seasons without a curated map", () => {
  // Every committed season (1992-93 → 2025-26) now has a curated map
  // (TASK-M04 + TASK-1203 + TASK-1403). Seasons outside the committed range
  // safely degrade to null (no color).
  it("returns null for a season outside the committed range", () => {
    expect(descriptionForTeam(40, 1991)).toBeNull(); // 1991-92 pre-dates the PL
    expect(descriptionForTeam(40, 2099)).toBeNull(); // future
  });
});

describe("descriptionForTeam — 1992-93 inaugural outcome (TASK-1403)", () => {
  it("Champions League: Manchester United (champions)", () => {
    expect(descriptionForTeam(33, 1992)).toMatch(/Champions League/);
  });

  it("UEFA Cup: Aston Villa (2nd) + Norwich City (3rd)", () => {
    expect(descriptionForTeam(66, 1992)).toBe("Promotion - UEFA Cup");
    expect(descriptionForTeam(71, 1992)).toBe("Promotion - UEFA Cup");
  });

  it("Cup Winners' Cup: Arsenal (1993 FA Cup winners) — pre-1999 era label", () => {
    expect(descriptionForTeam(42, 1992)).toBe("Promotion - Cup Winners' Cup");
  });

  it("Relegation: Crystal Palace, Middlesbrough, Nottingham Forest", () => {
    const rel = "Relegation - Championship";
    expect(descriptionForTeam(52, 1992)).toBe(rel);
    expect(descriptionForTeam(70, 1992)).toBe(rel);
    expect(descriptionForTeam(65, 1992)).toBe(rel);
  });

  it("mid-table → null (e.g. Liverpool 6th)", () => {
    expect(descriptionForTeam(40, 1992)).toBeNull();
  });
});

describe("per-season qualification consistency (TASK-M04)", () => {
  // Every committed season, 1992-93 → 2025-26 (1992-93 added in TASK-1403).
  const SEASONS = Array.from({ length: 2025 - 1992 + 1 }, (_, i) => 1992 + i);

  it("flags the champion (rank 1) as Champions League for every season", async () => {
    for (const season of SEASONS) {
      const res = await getStandings({ season });
      const table = res!.league.standings[0];
      const champ = table.find((r) => r.rank === 1)!;
      expect(descriptionForTeam(champ.team.id, season), `season ${season}`).toMatch(
        /Champions League/,
      );
    }
  });

  it("flags the bottom-N (3, or 4 in 1994-95) as Relegation for every season", async () => {
    for (const season of SEASONS) {
      const res = await getStandings({ season });
      const table = res!.league.standings[0];
      const relCount = table.length === 22 ? (season === 1994 ? 4 : 3) : 3;
      const bottom = [...table].sort((a, b) => b.rank - a.rank).slice(0, relCount);
      for (const row of bottom) {
        expect(
          descriptionForTeam(row.team.id, season),
          `season ${season} team ${row.team.id}`,
        ).toBe("Relegation - Championship");
      }
    }
  });

  it("uses era-accurate competition names", () => {
    // pre-2009: europa bucket = "UEFA Cup"; pre-1999: third bucket = "Cup Winners' Cup".
    expect(descriptionForTeam(42, 1996)).toBe("Promotion - UEFA Cup"); // Arsenal
    expect(descriptionForTeam(49, 1996)).toBe("Promotion - Cup Winners' Cup"); // Chelsea (FA Cup)
    // post-2009: "Europa League"; from 2021: "Conference League".
    expect(descriptionForTeam(40, 2022)).toBe("Promotion - Europa League"); // Liverpool
    expect(descriptionForTeam(66, 2022)).toBe("Promotion - Conference League"); // Aston Villa
  });

  it("relegation takes precedence for relegated cup-winners (Wigan 2012-13)", () => {
    // Wigan (61) won the 2013 FA Cup AND were relegated — they show as relegated.
    expect(descriptionForTeam(61, 2012)).toBe("Relegation - Championship");
  });
});
