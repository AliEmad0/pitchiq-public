import { describe, expect, it } from "vitest";

import { renderTeamsCard, teamsOgImagePath } from "@/app/api/og/teams-card";

describe("teamsOgImagePath", () => {
  it("builds the season-pinned OG route path", () => {
    expect(teamsOgImagePath(1996)).toBe("/api/og/teams?season=1996");
    expect(teamsOgImagePath(2025)).toBe("/api/og/teams?season=2025");
  });
});

describe("renderTeamsCard", () => {
  it("returns a 1200x630 root element for each era", () => {
    for (const era of ["retro90s", "goldenMillennium", "modern"] as const) {
      const el = renderTeamsCard({
        era,
        seasonLabel: "2025-26",
        crestUrls: ["https://example.com/1.png", "https://example.com/2.png"],
      }) as { type: string; props: { style: { width: number; height: number } } };
      expect(el.type).toBe("div");
      expect(el.props.style.width).toBe(1200);
      expect(el.props.style.height).toBe(630);
    }
  });
});
