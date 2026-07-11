import { describe, expect, it } from "vitest";

import { playerOgImagePath, renderPlayerCard } from "@/app/api/og/player-card";
import { playersOgImagePath, renderPlayersCard } from "@/app/api/og/players-card";

describe("players index OG", () => {
  it("builds the season-pinned route path", () => {
    expect(playersOgImagePath(2025)).toBe("/api/og/players?season=2025");
    expect(playersOgImagePath(1996)).toBe("/api/og/players?season=1996");
  });

  it("renders a 1200x630 root per era", () => {
    const players = [
      { name: "Salah", initials: "MS", photoUrl: "https://x/1.png", clubColor: "#C8102E", ga: 34 },
      { name: "Haaland", initials: "EH", photoUrl: null, clubColor: "#6CABDD", ga: 31 },
    ];
    const fields: Record<string, string> = {
      retro90s: "#e9e0cb",
      goldenMillennium: "#0b1422",
      modern: "#0c0a14",
    };
    for (const era of ["retro90s", "goldenMillennium", "modern"] as const) {
      const el = renderPlayersCard({ era, seasonLabel: "2025-26", players }) as {
        type: string;
        props: { style: { width: number; backgroundColor: string } };
      };
      expect(el.type).toBe("div");
      expect(el.props.style.width).toBe(1200);
      expect(el.props.style.backgroundColor).toBe(fields[era]);
    }
  });
});

describe("player profile OG", () => {
  it("builds the player+season route path", () => {
    expect(playerOgImagePath(1001119, 2025)).toBe("/api/og/player?id=1001119&season=2025");
  });

  it("renders a 1200x630 root per era", () => {
    const base = {
      firstName: "Mohamed",
      lastName: "Salah",
      initials: "MS",
      photoUrl: "https://x/p.png",
      clubColor: "#C8102E",
      position: "Forward",
      clubName: "Liverpool",
      goals: 29,
      assists: 18,
      seasonLabel: "2024-25",
    };
    const fields: Record<string, string> = {
      retro90s: "#e9e0cb",
      goldenMillennium: "#0b1422",
      modern: "#0c0a14",
    };
    for (const era of ["retro90s", "goldenMillennium", "modern"] as const) {
      const el = renderPlayerCard({ ...base, era }) as {
        type: string;
        props: { style: { height: number; backgroundColor: string } };
      };
      expect(el.type).toBe("div");
      expect(el.props.style.height).toBe(630);
      expect(el.props.style.backgroundColor).toBe(fields[era]);
    }
  });
});
