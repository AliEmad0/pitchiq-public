import { describe, expect, it } from "vitest";

import { managerOgImagePath, renderManagerCard } from "@/app/api/og/manager-card";

describe("managerOgImagePath", () => {
  it("builds the manager+season OG route path", () => {
    expect(managerOgImagePath("58", 2025)).toBe("/api/og/manager?id=58&season=2025");
    expect(managerOgImagePath("lm-ian-branfoot", 1996)).toBe(
      "/api/og/manager?id=lm-ian-branfoot&season=1996",
    );
  });
});

describe("renderManagerCard", () => {
  const base = {
    name: "Pep Guardiola",
    initials: "PG",
    photoUrl: "https://example.com/p.png",
    crestUrl: "https://example.com/c.png",
    clubName: "Manchester City",
    clubColor: "#6CABDD",
    seasonLabel: "2024-25",
  };

  it("returns a 1200x630 root element per era with era-specific field", () => {
    const fields: Record<string, string> = {
      retro90s: "#e9e0cb",
      goldenMillennium: "#0b1422",
      modern: "#0c0a14",
    };
    for (const era of ["retro90s", "goldenMillennium", "modern"] as const) {
      const el = renderManagerCard({ ...base, era }) as {
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
