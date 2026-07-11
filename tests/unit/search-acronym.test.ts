import { describe, expect, it } from "vitest";

import { nameAcronym } from "@/utils/search-acronym";

describe("nameAcronym", () => {
  it("takes the first letter of each whitespace token", () => {
    expect(nameAcronym("Kevin De Bruyne")).toBe("kdb");
    expect(nameAcronym("Robin van Persie")).toBe("rvp");
    expect(nameAcronym("Virgil van Dijk")).toBe("vvd");
    expect(nameAcronym("Cristiano Ronaldo")).toBe("cr");
  });

  it("splits on hyphens too", () => {
    expect(nameAcronym("Trent Alexander-Arnold")).toBe("taa");
    expect(nameAcronym("Aaron Wan-Bissaka")).toBe("awb");
  });

  it("collapses extra whitespace and lowercases", () => {
    expect(nameAcronym("  Bukayo   Saka ")).toBe("bs");
  });
});
