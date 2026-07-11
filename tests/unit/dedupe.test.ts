import { describe, expect, it } from "vitest";

import { dedupeById } from "@/utils/dedupe";

describe("dedupeById", () => {
  it("keeps the first occurrence of each id, preserving order", () => {
    const out = dedupeById([
      { id: 1, n: "a" },
      { id: 2, n: "b" },
      { id: 1, n: "a2" },
      { id: 3, n: "c" },
    ]);
    expect(out.map((x) => x.id)).toEqual([1, 2, 3]);
    expect(out[0]?.n).toBe("a"); // first wins
  });

  it("returns an empty array unchanged", () => {
    expect(dedupeById([])).toEqual([]);
  });
});
