import { describe, expect, it } from "vitest";

import { buildNameResolver } from "@/features/leagues/fixture-links";

describe("buildNameResolver", () => {
  it("resolves an exact (normalized) name to its id", () => {
    const resolve = buildNameResolver([
      { id: 10, name: "Bruno Fernandes" },
      { id: 20, name: "Bernd Leno" },
    ]);
    expect(resolve("Bruno Fernandes")).toBe(10);
    expect(resolve("bruno fernandes")).toBe(10);
  });

  it("returns null for a miss", () => {
    const resolve = buildNameResolver([{ id: 10, name: "Bruno Fernandes" }]);
    expect(resolve("Marcus Rashford")).toBeNull();
    expect(resolve(null)).toBeNull();
  });

  it("returns null for an ambiguous name (two different ids)", () => {
    const resolve = buildNameResolver([
      { id: 1, name: "Danny Ward" },
      { id: 2, name: "Danny Ward" },
    ]);
    expect(resolve("Danny Ward")).toBeNull();
  });

  it("works with string ids (managers)", () => {
    const resolve = buildNameResolver([{ id: "51070", name: "Graham Potter" }]);
    expect(resolve("Graham Potter")).toBe("51070");
  });
});
