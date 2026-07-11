import { describe, expect, it } from "vitest";

import { fixtureOgImagePath, renderFixtureCard } from "@/app/api/og/fixture-card";
import { fixturesOgImagePath, renderFixturesCard } from "@/app/api/og/fixtures-card";

const FIELDS: Record<string, string> = {
  retro90s: "#e9e0cb",
  goldenMillennium: "#0b1422",
  modern: "#0c0a14",
};

describe("fixtures index OG", () => {
  it("builds the season-pinned route path", () => {
    expect(fixturesOgImagePath(2025)).toBe("/api/og/fixtures?season=2025");
    expect(fixturesOgImagePath(1996)).toBe("/api/og/fixtures?season=1996");
  });

  it("renders a 1200x630 root per era", () => {
    const pairs = [
      {
        home: { crestUrl: "https://x/1.png", abbr: "ARS", color: "#EF0107" },
        away: { crestUrl: null, abbr: "LIV", color: "#C8102E" },
      },
    ];
    for (const era of ["retro90s", "goldenMillennium", "modern"] as const) {
      const el = renderFixturesCard({ era, seasonLabel: "2025-26", pairs }) as {
        type: string;
        props: { style: { width: number; backgroundColor: string } };
      };
      expect(el.type).toBe("div");
      expect(el.props.style.width).toBe(1200);
      expect(el.props.style.backgroundColor).toBe(FIELDS[era]);
    }
  });
});

describe("fixture detail OG", () => {
  it("builds the id-pinned route path (season derived in the route)", () => {
    expect(fixtureOgImagePath("2026-01-12-LIV-ARS")).toBe("/api/og/fixture?id=2026-01-12-LIV-ARS");
  });

  it("renders a 1200x630 match-ticket root per era", () => {
    const base = {
      home: { crestUrl: "https://x/h.png", abbr: "LIV", name: "Liverpool", color: "#C8102E" },
      away: { crestUrl: null, abbr: "ARS", name: "Arsenal", color: "#EF0107" },
      homeScore: 2,
      awayScore: 1,
      metaLine: "12 Jan 2026 · Anfield",
      seasonLabel: "2025-26",
    };
    // eraTheme page backgrounds: modern #0c0a14, golden #0b1422, retro #e9e0cb.
    for (const era of ["retro90s", "goldenMillennium", "modern"] as const) {
      const el = renderFixtureCard({ ...base, era }) as {
        type: string;
        props: { style: { height: number; backgroundColor: string } };
      };
      expect(el.type).toBe("div");
      expect(el.props.style.height).toBe(630);
      expect(el.props.style.backgroundColor).toBe(FIELDS[era]);
    }
  });
});
