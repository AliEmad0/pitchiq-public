import { describe, expect, it } from "vitest";

import * as leaderboardsRoute from "@/app/api/og/leaderboards/route";

// Shape test: rendering the OG PNG needs Satori fonts, verified live. Pin the
// route contract so a config drift is caught.
describe("leaderboards OG route", () => {
  it("is a nodejs GET handler", () => {
    expect(leaderboardsRoute.runtime).toBe("nodejs");
    expect(typeof leaderboardsRoute.GET).toBe("function");
  });
});
