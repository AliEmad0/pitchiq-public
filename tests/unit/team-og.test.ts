import { describe, expect, it } from "vitest";

import { renderTeamCard, teamOgImagePath } from "@/app/api/og/team-card";

describe("teamOgImagePath", () => {
  it("builds the team+season OG route path", () => {
    expect(teamOgImagePath(42, 2025)).toBe("/api/og/team?teamId=42&season=2025");
    expect(teamOgImagePath(40, 1996)).toBe("/api/og/team?teamId=40&season=1996");
  });
});

describe("renderTeamCard", () => {
  const base = {
    clubName: "Liverpool",
    crestUrl: "https://example.com/40.png",
    clubColor: "#C8102E",
    seasonLabel: "2024-25",
    rankLabel: "1st",
    points: 84,
    goalDiff: "+45",
  };

  it("returns a 1200x630 root element for every era", () => {
    for (const era of ["retro90s", "goldenMillennium", "modern"] as const) {
      const el = renderTeamCard({ ...base, era }) as {
        type: string;
        props: { style: { width: number; height: number; backgroundColor: string } };
      };
      expect(el.type).toBe("div");
      expect(el.props.style.width).toBe(1200);
      expect(el.props.style.height).toBe(630);
    }
  });

  it("uses the dark dossier field for retro and the neon field otherwise", () => {
    const retro = renderTeamCard({ ...base, era: "retro90s" }) as {
      props: { style: { backgroundColor: string } };
    };
    const modern = renderTeamCard({ ...base, era: "modern" }) as {
      props: { style: { backgroundColor: string } };
    };
    expect(retro.props.style.backgroundColor).toBe("#0c0a14");
    expect(modern.props.style.backgroundColor).toBe("#050509");
  });
});
