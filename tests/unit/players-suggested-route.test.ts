/**
 * Tests for `GET /api/players/suggested` (TASK-604) and the underlying
 * `getSuggestedPlayers` fetcher. Both read the committed snapshot leaderboard +
 * player snapshots (no HTTP mocking), so these assert against real 2024-25
 * data: the season's top scorer is Mohamed Salah (Liverpool).
 */
import { describe, expect, it } from "vitest";

import { GET } from "@/app/api/players/suggested/route";
import { getSuggestedPlayers } from "@/features/players/api";

function request(qs = ""): Request {
  return new Request(`http://localhost/api/players/suggested${qs}`);
}

describe("getSuggestedPlayers — fetcher", () => {
  it("returns two non-empty sections for season 2024", async () => {
    const data = await getSuggestedPlayers(2024);
    expect(data.topScorers.length).toBeGreaterThan(0);
    expect(data.topAssists.length).toBeGreaterThan(0);
    expect(data.topScorers.length).toBeLessThanOrEqual(10);
    expect(data.topAssists.length).toBeLessThanOrEqual(10);
  });

  it("ranks Mohamed Salah first among scorers, with the slim hit shape", async () => {
    const data = await getSuggestedPlayers(2024);
    const top = data.topScorers[0];
    expect(top.name).toBe("Mohamed Salah");
    expect(top.team.name).toBe("Liverpool");
    expect(top.team.logo).toBe("/logos/40.png");
    // photo was joined from the player snapshot by leaderboards.api — a resolvable
    // <PlayerImage> source (FPL code OR an https URL; Salah's broken FPL code was
    // replaced by his committed portrait in TASK-M28e).
    expect(top.photo).toMatch(/^(\d+|https?:\/\/)/);
  });

  it("returns empty sections for a season with no committed snapshot", async () => {
    // Every season 1993-2025 now has player data (TASK-1402 filled 1993-2009), so
    // an out-of-range future year is used to exercise the no-snapshot path.
    const data = await getSuggestedPlayers(2099);
    expect(data.topScorers).toEqual([]);
    expect(data.topAssists).toEqual([]);
  });
});

describe("GET /api/players/suggested — route", () => {
  it("200s with both sections for ?season=2024", async () => {
    const res = await GET(request("?season=2024"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.topScorers[0].name).toBe("Mohamed Salah");
    expect(body.topAssists.length).toBeGreaterThan(0);
  });

  it("defaults to the latest committed data season when ?season= is absent", async () => {
    const res = await GET(request());
    expect(res.status).toBe(200);
    const body = await res.json();
    // currentDataSeason() === 2025, which has player data (TASK-1202)
    expect(body.topScorers.length).toBeGreaterThan(0);
  });

  it("clamps an out-of-range season to the latest committed season (always 200 + data)", async () => {
    // Post-TASK-1402 every in-range season (1993-2025) has player data, so the
    // route can't yield empty for a valid season. parseSeason clamps an out-of-
    // range future year to currentDataSeason() (2025), which has data.
    const res = await GET(request("?season=2099"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.topScorers.length).toBeGreaterThan(0);
    expect(body.topAssists.length).toBeGreaterThan(0);
  });

  it("serves real data for a historical season filled by TASK-1402 (2009)", async () => {
    const res = await GET(request("?season=2009"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.topScorers.length).toBeGreaterThan(0);
  });
});
