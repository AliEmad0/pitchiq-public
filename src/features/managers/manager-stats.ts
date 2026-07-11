import type { ManagersFile } from "@/data/schemas";

/**
 * Pure read-side helpers for the manager pages (TASK-M49). Derive per-manager
 * records (points/PPG/win%), season index rows, full-career aggregation, and
 * PL-title attribution from the committed `managers.json` shape. No I/O — the
 * server fetchers supply the loaded file + standings, so these unit-test with
 * synthetic data.
 */

export type ManagerEntryLite = {
  id: string;
  name: string;
  matches: number;
  win: number;
  draw: number;
  loss: number;
  gf: number;
  ga: number;
};

export type ManagerRecord = {
  played: number;
  win: number;
  draw: number;
  loss: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
  ppg: number;
  winPct: number;
};

/** Derive points (3·W+D), goal difference, PPG, and win% from a raw tally. */
export function recordFrom(e: Omit<ManagerEntryLite, "id" | "name">): ManagerRecord {
  const played = e.matches;
  const points = e.win * 3 + e.draw;
  return {
    played,
    win: e.win,
    draw: e.draw,
    loss: e.loss,
    gf: e.gf,
    ga: e.ga,
    gd: e.gf - e.ga,
    points,
    ppg: played ? points / played : 0,
    winPct: played ? (e.win / played) * 100 : 0,
  };
}

export type SeasonManagerRow = {
  managerId: string;
  name: string;
  teamId: number;
  record: ManagerRecord;
};

/** One row per (manager, club) for a season, sorted points desc → ppg desc → id. */
export function seasonManagerRows(managers: ManagersFile, season: number): SeasonManagerRow[] {
  const byTeam = managers[String(season)] ?? {};
  const rows: SeasonManagerRow[] = [];
  for (const [teamId, list] of Object.entries(byTeam)) {
    for (const e of list as ManagerEntryLite[]) {
      rows.push({ managerId: e.id, name: e.name, teamId: Number(teamId), record: recordFrom(e) });
    }
  }
  rows.sort(
    (a, b) =>
      b.record.points - a.record.points ||
      b.record.ppg - a.record.ppg ||
      a.managerId.localeCompare(b.managerId),
  );
  return rows;
}

export type ManagerClubLine = { teamId: number; seasons: number[]; record: ManagerRecord };
export type ManagerSeasonLine = {
  season: number;
  teamId: number;
  name: string;
  record: ManagerRecord;
};
export type ManagerCareer = {
  name: string;
  seasonsList: number[];
  byClub: ManagerClubLine[];
  bySeason: ManagerSeasonLine[];
  totals: ManagerRecord;
};

type Acc = Omit<ManagerEntryLite, "id" | "name">;
const emptyAcc = (): Acc => ({ matches: 0, win: 0, draw: 0, loss: 0, gf: 0, ga: 0 });

/** Aggregate a manager's whole career from the managers file, or null if absent. */
export function aggregateManagerCareer(managers: ManagersFile, id: string): ManagerCareer | null {
  const seasons = Object.keys(managers)
    .map(Number)
    .sort((a, b) => a - b);
  const clubAcc = new Map<number, { seasons: number[]; acc: Acc }>();
  const bySeason: ManagerSeasonLine[] = [];
  const seasonsList: number[] = [];
  let name = "";

  for (const season of seasons) {
    const byTeam = managers[String(season)];
    let appeared = false;
    for (const [teamId, list] of Object.entries(byTeam)) {
      const e = (list as ManagerEntryLite[]).find((x) => x.id === id);
      if (!e) continue;
      appeared = true;
      name = e.name;
      const tId = Number(teamId);
      bySeason.push({ season, teamId: tId, name: e.name, record: recordFrom(e) });
      const cur = clubAcc.get(tId) ?? { seasons: [], acc: emptyAcc() };
      cur.seasons.push(season);
      cur.acc.matches += e.matches;
      cur.acc.win += e.win;
      cur.acc.draw += e.draw;
      cur.acc.loss += e.loss;
      cur.acc.gf += e.gf;
      cur.acc.ga += e.ga;
      clubAcc.set(tId, cur);
    }
    if (appeared) seasonsList.push(season);
  }
  if (clubAcc.size === 0) return null;

  const byClub: ManagerClubLine[] = [...clubAcc.entries()]
    .map(([teamId, v]) => ({ teamId, seasons: v.seasons, record: recordFrom(v.acc) }))
    .sort(
      (a, b) =>
        b.record.points - a.record.points ||
        b.record.played - a.record.played ||
        a.teamId - b.teamId,
    );

  const totalsAcc = byClub.reduce((acc, c) => {
    acc.matches += c.record.played;
    acc.win += c.record.win;
    acc.draw += c.record.draw;
    acc.loss += c.record.loss;
    acc.gf += c.record.gf;
    acc.ga += c.record.ga;
    return acc;
  }, emptyAcc());

  bySeason.sort((a, b) => a.season - b.season || a.teamId - b.teamId);
  return { name, seasonsList, byClub, bySeason, totals: recordFrom(totalsAcc) };
}

export type ManagerTitle = { season: number; teamId: number };

/**
 * PL titles for a manager: a season where his club finished 1st AND he was that
 * club's primary (most-matches) manager that season. `championBySeason` maps a
 * season → the 1st-place team id (from standings). The managers file's per-team
 * list is already sorted most-matches-first, so the primary is `list[0]`.
 */
export function deriveManagerTitles(
  managers: ManagersFile,
  id: string,
  championBySeason: Record<number | string, number>,
): ManagerTitle[] {
  const titles: ManagerTitle[] = [];
  for (const [seasonStr, teamId] of Object.entries(championBySeason)) {
    const list = managers[seasonStr]?.[String(teamId)] as ManagerEntryLite[] | undefined;
    if (list && list.length > 0 && list[0].id === id)
      titles.push({ season: Number(seasonStr), teamId });
  }
  titles.sort((a, b) => a.season - b.season);
  return titles;
}
