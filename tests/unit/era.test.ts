import { describe, expect, it } from "vitest";

import { eraForSeason } from "@/utils/era";

describe("eraForSeason", () => {
  it("maps the inaugural season + the 90s to retro90s (boundary 1999)", () => {
    expect(eraForSeason(1992)).toBe("retro90s");
    expect(eraForSeason(1999)).toBe("retro90s");
  });

  it("maps 2000-2009 to goldenMillennium (boundaries 2000 + 2009)", () => {
    expect(eraForSeason(2000)).toBe("goldenMillennium");
    expect(eraForSeason(2004)).toBe("goldenMillennium");
    expect(eraForSeason(2009)).toBe("goldenMillennium");
  });

  it("maps 2010-present to modern (boundary 2010 + the current season)", () => {
    expect(eraForSeason(2010)).toBe("modern");
    expect(eraForSeason(2025)).toBe("modern");
  });
});
