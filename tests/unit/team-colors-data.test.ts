import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";

import { TeamColorsFileSchema } from "@/data/schemas";

describe("data/team-colors.json (TASK-M47)", () => {
  const colors = TeamColorsFileSchema.parse(
    JSON.parse(readFileSync("data/team-colors.json", "utf8")),
  );

  it("is a valid home/away hex map", () => {
    // Schema parse above already enforces #rrggbb on home + away.
    expect(colors["33"]).toEqual({
      home: expect.stringMatching(/^#/),
      away: expect.stringMatching(/^#/),
    });
  });

  it("covers every distinct club across all committed seasons (51 clubs)", () => {
    const ids = new Set<number>();
    for (const f of readdirSync("data").filter((n) => /^teams-\d+\.json$/.test(n))) {
      for (const t of JSON.parse(readFileSync(`data/${f}`, "utf8")) as Array<{ id: number }>) {
        ids.add(t.id);
      }
    }
    const missing = [...ids].filter((id) => !(String(id) in colors)).sort((a, b) => a - b);
    expect(missing).toEqual([]);
    expect(Object.keys(colors).length).toBe(51);
  });
});
