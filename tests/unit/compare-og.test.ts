import { describe, expect, it } from "vitest";

import { compareOgImagePath, renderCompareCard, type CompareSlot } from "@/app/api/og/compare-card";

const HAALAND: CompareSlot = {
  surname: "Haaland",
  club: "Manchester City",
  label: "2025-26",
  goals: 27,
  assists: 5,
};
const SALAH: CompareSlot = {
  surname: "Salah",
  club: "Liverpool",
  label: "2025-26",
  goals: 20,
  assists: 18,
};

describe("compare OG card", () => {
  it("builds the route path with both slots", () => {
    expect(compareOgImagePath({ season: 2025, a: 1001119, b: 1000208, sa: 2025, sb: 2025 })).toBe(
      "/api/og/compare?season=2025&a=1001119&sa=2025&b=1000208&sb=2025",
    );
  });

  it("carries per-slot seasons (cross-era) and the 'all' aggregate", () => {
    expect(compareOgImagePath({ season: 2025, a: 521, b: 1, sa: 2003, sb: "all" })).toBe(
      "/api/og/compare?season=2025&a=521&sa=2003&b=1&sb=all",
    );
  });

  it("omits a slot's params when its id is absent (empty state)", () => {
    expect(compareOgImagePath({ season: 1996, a: null, b: null, sa: 1996, sb: 1996 })).toBe(
      "/api/og/compare?season=1996",
    );
  });

  it("renders a 1200x630 root per era (both slots)", () => {
    const fields: Record<string, string> = {
      retro90s: "#e9e0cb",
      goldenMillennium: "#0b1422",
      modern: "#0c0a14",
    };
    for (const era of ["retro90s", "goldenMillennium", "modern"] as const) {
      const el = renderCompareCard({ era, seasonLabel: "2025-26", a: HAALAND, b: SALAH }) as {
        type: string;
        props: { style: { width: number; height: number; backgroundColor: string } };
      };
      expect(el.type).toBe("div");
      expect(el.props.style.width).toBe(1200);
      expect(el.props.style.height).toBe(630);
      expect(el.props.style.backgroundColor).toBe(fields[era]);
    }
  });

  it("renders the generic poster when a slot is null", () => {
    const el = renderCompareCard({ era: "modern", seasonLabel: "2025-26", a: HAALAND, b: null });
    expect((el as { type: string }).type).toBe("div");
  });
});
