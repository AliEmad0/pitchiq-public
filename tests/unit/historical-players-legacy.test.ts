import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * TASK-1402 — real committed-data anchors for the legacy-PL-API player backfill
 * (1993-94 → 2009-10). These read the generated data/ files directly and pin a
 * few historically-verifiable facts so a future re-sync that silently changes the
 * source is caught.
 */
const dataDir = join(process.cwd(), "data");

type PlayerRow = {
  id: number;
  name: string;
  teamName: string;
  metrics: { goals: number | null; appearances: number | null };
};
type Board = { topScorers: Array<{ playerName: string; value: number }> };

const players = (yr: number): PlayerRow[] =>
  JSON.parse(readFileSync(join(dataDir, `players-${yr}.json`), "utf8"));
const board = (yr: number): Board =>
  JSON.parse(readFileSync(join(dataDir, `leaderboards-${yr}.json`), "utf8"));

describe("TASK-1402 historical players (legacy PL API)", () => {
  it("1993-94 Golden Boot = Andrew Cole, 34 (Newcastle)", () => {
    expect(board(1993).topScorers[0]).toMatchObject({ playerName: "Andrew Cole", value: 34 });
  });

  it("1995-96 Golden Boot = Alan Shearer, 31", () => {
    expect(board(1995).topScorers[0]).toMatchObject({ playerName: "Alan Shearer", value: 31 });
  });

  it("each legacy season has a plausible roster (>= 400 players, all with >= 1 appearance)", () => {
    for (const yr of [1993, 2000, 2009]) {
      const ps = players(yr);
      expect(ps.length).toBeGreaterThanOrEqual(400);
      expect(ps.every((p) => (p.metrics.appearances ?? 0) >= 1)).toBe(true);
    }
  });

  it("recovers a star previously dropped by the squad endpoint (Gerrard 2008-09, Liverpool)", () => {
    const g = players(2008).find((p) => p.name === "Steven Gerrard");
    expect(g).toBeDefined();
    expect(g!.teamName).toBe("Liverpool");
    expect(g!.metrics.appearances ?? 0).toBeGreaterThan(0);
  });

  it("a cross-era player keeps the SAME id pre-2010 and at a 2017+ season", () => {
    const id09 = players(2009).find((p) => p.name === "James Milner")?.id;
    const id17 = players(2017).find((p) => p.name === "James Milner")?.id;
    expect(id09).toBeDefined();
    expect(id17).toBeDefined();
    expect(id09).toBe(id17);
  });

  it("1992-93 inaugural season: Man Utd champions (84), Sheringham top scorer (22) — TASK-1403", () => {
    const standings = JSON.parse(
      readFileSync(join(dataDir, "standings-1992.json"), "utf8"),
    ) as Array<{ teamName: string; points: number; rank: number }>;
    expect(standings).toHaveLength(22);
    const champ = standings.find((r) => r.rank === 1)!;
    expect(champ.teamName).toBe("Manchester United");
    expect(champ.points).toBe(84);
    expect(board(1992).topScorers[0]).toMatchObject({ playerName: "Teddy Sheringham", value: 22 });
  });
});
