import { describe, expect, it } from "vitest";

import { highlightMatch } from "@/utils/highlight";

describe("highlightMatch", () => {
  it("marks every (case-insensitive) occurrence of the query", () => {
    // "VAN" (mixed case) highlights the inner "van" in "Cavani".
    expect(highlightMatch("Cavani", "VAN")).toEqual([
      { text: "Ca", match: false },
      { text: "van", match: true },
      { text: "i", match: false },
    ]);
  });

  it("returns the whole name unhighlighted when the query is empty", () => {
    expect(highlightMatch("Bukayo Saka", "")).toEqual([{ text: "Bukayo Saka", match: false }]);
  });

  it("returns the whole name unhighlighted when there is no match", () => {
    expect(highlightMatch("Bukayo Saka", "xyz")).toEqual([{ text: "Bukayo Saka", match: false }]);
  });

  it("does not throw on regex-special characters in the query", () => {
    expect(() => highlightMatch("O'Brien (c)", "(c)")).not.toThrow();
    const segs = highlightMatch("O'Brien (c)", "(c)");
    expect(segs.some((s) => s.match && s.text === "(c)")).toBe(true);
  });

  it("concatenated segment text always equals the original name", () => {
    const name = "Cristiano Ronaldo";
    expect(
      highlightMatch(name, "ron")
        .map((s) => s.text)
        .join(""),
    ).toBe(name);
  });
});
