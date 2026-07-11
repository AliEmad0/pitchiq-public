import { describe, expect, it } from "vitest";

import {
  leaderboardsOgImagePath,
  renderLeaderboardsCard,
  type LeaderboardTile,
} from "@/app/api/og/leaderboards-card";

const TILES: LeaderboardTile[] = [
  { label: "GOALS", leader: "Haaland", value: "27" },
  { label: "ASSISTS", leader: "Salah", value: "18" },
  { label: "CLEAN SHEETS", leader: "Raya", value: "14" },
  { label: "SAVES", leader: "Flekken", value: "153" },
  { label: "XG", leader: "Haaland", value: "24.1" },
];

describe("leaderboards index OG", () => {
  it("builds the season-pinned route path", () => {
    expect(leaderboardsOgImagePath(2025)).toBe("/api/og/leaderboards?season=2025");
    expect(leaderboardsOgImagePath(1996)).toBe("/api/og/leaderboards?season=1996");
  });

  it("renders a 1200x630 root per era", () => {
    const fields: Record<string, string> = {
      retro90s: "#e9e0cb",
      goldenMillennium: "#0b1422",
      modern: "#0c0a14",
    };
    for (const era of ["retro90s", "goldenMillennium", "modern"] as const) {
      const el = renderLeaderboardsCard({ era, seasonLabel: "2025-26", tiles: TILES }) as {
        type: string;
        props: { style: { width: number; height: number; backgroundColor: string } };
      };
      expect(el.type).toBe("div");
      expect(el.props.style.width).toBe(1200);
      expect(el.props.style.height).toBe(630);
      expect(el.props.style.backgroundColor).toBe(fields[era]);
    }
  });

  it("renders with no tiles (empty/unsupported season) without throwing", () => {
    const el = renderLeaderboardsCard({ era: "modern", seasonLabel: "1993-94", tiles: [] });
    expect((el as { type: string }).type).toBe("div");
  });
});
