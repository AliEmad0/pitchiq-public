import { describe, expect, it } from "vitest";

import { clubLogo, clubLogoFromMap, type LogoVariant } from "@/utils/club-logo";

const ARSENAL: LogoVariant[] = [{ since: 1992, until: 2001, file: "42-1992.png" }];
const CITY: LogoVariant[] = [
  { since: 1992, until: 1996, file: "52-1992.png" },
  { since: 1997, until: 2015, file: "52-1997.png" },
];

describe("clubLogo", () => {
  it("returns the history file when a range contains the season", () => {
    expect(clubLogo(42, 1996, ARSENAL)).toBe("/logos/history/42-1992.png");
  });

  it("treats since/until as inclusive boundaries", () => {
    expect(clubLogo(42, 1992, ARSENAL)).toBe("/logos/history/42-1992.png"); // since
    expect(clubLogo(42, 2001, ARSENAL)).toBe("/logos/history/42-1992.png"); // until
  });

  it("falls back to the base crest past the last range (current era)", () => {
    expect(clubLogo(42, 2002, ARSENAL)).toBe("/logos/42.png");
    expect(clubLogo(42, 2024, ARSENAL)).toBe("/logos/42.png");
  });

  it("picks the correct range among several and falls into a gap → base", () => {
    expect(clubLogo(52, 1995, CITY)).toBe("/logos/history/52-1992.png");
    expect(clubLogo(52, 2010, CITY)).toBe("/logos/history/52-1997.png");
    expect(clubLogo(52, 1996, CITY)).toBe("/logos/history/52-1992.png"); // until of first
    expect(clubLogo(52, 2016, CITY)).toBe("/logos/52.png"); // current era after last until
  });

  it("returns the base crest when there are no variants", () => {
    expect(clubLogo(99, 2000, undefined)).toBe("/logos/99.png");
    expect(clubLogo(99, 2000, [])).toBe("/logos/99.png");
  });
});

describe("clubLogoFromMap", () => {
  const map: Record<string, LogoVariant[]> = { "42": ARSENAL };

  it("looks the club up by string key then resolves", () => {
    expect(clubLogoFromMap(42, 1996, map)).toBe("/logos/history/42-1992.png");
    expect(clubLogoFromMap(42, 2020, map)).toBe("/logos/42.png");
  });

  it("returns the base crest for a club not in the map (or null map)", () => {
    expect(clubLogoFromMap(7, 1996, map)).toBe("/logos/7.png");
    expect(clubLogoFromMap(42, 1996, null)).toBe("/logos/42.png");
  });
});
