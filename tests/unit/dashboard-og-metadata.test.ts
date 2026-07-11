import { describe, expect, it } from "vitest";

import { dashboardOgImagePath } from "../../src/app/api/og/ticket";
import { currentDataSeason } from "../../src/utils/season";

describe("dashboardOgImagePath", () => {
  it("builds the season-pinned OG route path", () => {
    expect(dashboardOgImagePath(1996)).toBe("/api/og/dashboard?season=1996");
  });

  it("uses whatever season it is given (caller clamps via parseSeason)", () => {
    expect(dashboardOgImagePath(currentDataSeason())).toBe(
      `/api/og/dashboard?season=${currentDataSeason()}`,
    );
  });
});
