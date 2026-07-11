import { describe, expect, it } from "vitest";

import {
  fixtureDetailTag,
  fixturesLastTag,
  fixturesNextTag,
  leaderboardTag,
  metricMaxesTag,
  playerStatsTag,
  squadTag,
  standingsTag,
  teamRecentFixturesTag,
  teamsListTag,
  teamStatsTag,
  teamTag,
  PREMIER_LEAGUE_ID,
} from "@/utils/cache-tags";

describe("cache-tags helpers (string format is part of the cache contract)", () => {
  it("exposes the Premier League id as 39", () => {
    expect(PREMIER_LEAGUE_ID).toBe(39);
  });

  it("standingsTag includes league + season", () => {
    expect(standingsTag(2024)).toBe("standings:39:2024");
  });

  it("leaderboardTag has the kind + season — no league segment", () => {
    expect(leaderboardTag("topscorers", 2024)).toBe("leaderboards:topscorers:2024");
    expect(leaderboardTag("topassists", 2023)).toBe("leaderboards:topassists:2023");
    expect(leaderboardTag("topyellowcards", 2024)).toBe("leaderboards:topyellowcards:2024");
    expect(leaderboardTag("topredcards", 2024)).toBe("leaderboards:topredcards:2024");
  });

  it("fixturesNextTag / fixturesLastTag include direction + league + season", () => {
    expect(fixturesNextTag(2024)).toBe("fixtures:next:39:2024");
    expect(fixturesLastTag(2024)).toBe("fixtures:last:39:2024");
  });

  it("forward-defined helpers (Phase 3/4 tickets) match the documented format", () => {
    expect(teamTag(33)).toBe("team:33");
    expect(teamsListTag(2024)).toBe("teams:39:2024");
    expect(teamStatsTag(2024, 33)).toBe("team-stats:2024:33");
    expect(teamRecentFixturesTag(2024, 33)).toBe("team-recent-fixtures:2024:33");
    expect(squadTag(33)).toBe("squad:33");
    expect(playerStatsTag(909, 2024)).toBe("player-stats:909:2024");
    expect(fixtureDetailTag(710000)).toBe("fixture-detail:710000");
  });

  it("metricMaxesTag includes league + season — same shape as standings/teams", () => {
    expect(metricMaxesTag(2024)).toBe("metric-maxes:39:2024");
    expect(metricMaxesTag(2023)).toBe("metric-maxes:39:2023");
  });
});
