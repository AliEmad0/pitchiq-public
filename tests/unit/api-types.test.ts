import { describe, expect, it } from "vitest";

import type { ApiResponse, Fixture, PlayerLeaderboardEntry } from "@/types/api";

import fixturesOpener from "../fixtures/wire/fixtures-opener.json";
import topscorers from "../fixtures/wire/topscorers.json";

// Each typed assignment below is the AC #3 evidence: if any field declared on
// the new types is missing or wrong-typed against the live payload, `tsc
// --noEmit` fails. The runtime assertions cover the inverse direction —
// that the sample isn't accidentally empty.
//
// Payloads were captured 2026-05-18 from:
//   GET /players/topscorers?league=39&season=2024
//   GET /fixtures?league=39&season=2024&from=2024-08-16&to=2024-08-17
const _fixtureShapeCheck: ApiResponse<Fixture[]> = fixturesOpener;
const _leaderboardShapeCheck: ApiResponse<PlayerLeaderboardEntry[]> = topscorers;

describe("wire v3 type shapes — live payload contract", () => {
  it("ApiResponse<Fixture[]> matches a real /fixtures payload", () => {
    const data = _fixtureShapeCheck;

    expect(data.get).toBe("fixtures");
    expect(data.response.length).toBeGreaterThan(0);

    const first = data.response[0];
    expect(typeof first.fixture.id).toBe("number");
    expect(typeof first.fixture.timestamp).toBe("number");
    expect(typeof first.teams.home.id).toBe("number");
    expect(typeof first.teams.home.name).toBe("string");
    // `winner` is one of true | false | null — assert membership of the union
    expect([true, false, null]).toContain(first.teams.home.winner);
    // Both `goals.home` and `goals.away` may legitimately be null for not-
    // yet-played fixtures; here they're numbers because the opener weekend
    // is finished. Validate union membership, not a specific value.
    expect(["number", "object"]).toContain(typeof first.goals.home);
  });

  it("ApiResponse<PlayerLeaderboardEntry[]> matches a real /players/topscorers payload", () => {
    const data = _leaderboardShapeCheck;

    expect(data.get).toBe("players/topscorers");
    expect(data.response.length).toBeGreaterThan(0);

    const first = data.response[0];
    // The 1-entry invariant for top-N endpoints: each player has exactly
    // one statistics record. The fetcher in TASK-202 must enforce this at
    // the boundary since the wire type is `readonly PlayerStatisticsEntry[]`.
    expect(first.statistics).toHaveLength(1);
    const stats = first.statistics[0];

    expect(typeof first.player.id).toBe("number");
    expect(typeof first.player.name).toBe("string");
    expect(typeof stats.team.id).toBe("number");
    expect(typeof stats.league.season).toBe("number");
    // The two wire typos are accessible exactly as declared on the
    // type — this asserts we didn't silently rename them.
    expect(stats.games).toHaveProperty("appearences");
    expect(stats.penalty).toHaveProperty("commited");
  });
});
