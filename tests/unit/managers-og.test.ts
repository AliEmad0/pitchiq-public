import { describe, expect, it } from "vitest";

import { managersOgImagePath, renderManagersCard } from "@/app/api/og/managers-card";

describe("managersOgImagePath", () => {
  it("builds the season-pinned OG route path", () => {
    expect(managersOgImagePath(2025)).toBe("/api/og/managers?season=2025");
    expect(managersOgImagePath(1996)).toBe("/api/og/managers?season=1996");
  });
});

describe("renderManagersCard", () => {
  const managers = [
    {
      name: "Mikel Arteta",
      initials: "MA",
      photoUrl: "https://x/1.png",
      clubColor: "#EF0107",
      ppg: "2.42",
    },
    { name: "Arne Slot", initials: "AS", photoUrl: null, clubColor: "#C8102E", ppg: "2.31" },
  ];

  it("returns a 1200x630 root element per era with era-specific field", () => {
    const fields: Record<string, string> = {
      retro90s: "#e9e0cb",
      goldenMillennium: "#0b1422",
      modern: "#0c0a14",
    };
    for (const era of ["retro90s", "goldenMillennium", "modern"] as const) {
      const el = renderManagersCard({ era, seasonLabel: "2025-26", managers }) as {
        type: string;
        props: { style: { width: number; height: number; backgroundColor: string } };
      };
      expect(el.type).toBe("div");
      expect(el.props.style.width).toBe(1200);
      expect(el.props.style.height).toBe(630);
      expect(el.props.style.backgroundColor).toBe(fields[era]);
    }
  });
});
