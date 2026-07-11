import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { GEO_REFERENCE } from "@/data/geo-reference";
import { ClubLogosFileSchema } from "@/data/schemas";

// Integrity of the committed historical-crest map (TASK-M54).
const ROOT = process.cwd();
const raw = JSON.parse(readFileSync(join(ROOT, "data", "club-logos.json"), "utf8"));

describe("data/club-logos.json", () => {
  it("matches the schema", () => {
    expect(() => ClubLogosFileSchema.parse(raw)).not.toThrow();
  });

  const map = ClubLogosFileSchema.parse(raw);
  const realIds = new Set(GEO_REFERENCE.map((g) => g.teamId));

  it("keys are real club ids", () => {
    for (const key of Object.keys(map)) {
      expect(realIds.has(Number(key))).toBe(true);
    }
  });

  it("each club's ranges are valid, sorted ascending, and non-overlapping", () => {
    for (const [teamId, ranges] of Object.entries(map)) {
      for (const r of ranges) {
        expect(r.since).toBeLessThanOrEqual(r.until);
        // file name convention: <teamId>-<since>.png
        expect(r.file).toBe(`${teamId}-${r.since}.png`);
      }
      for (let i = 1; i < ranges.length; i++) {
        expect(ranges[i].since).toBeGreaterThan(ranges[i - 1].until); // sorted + no overlap
      }
    }
  });

  it("every referenced history image exists in public/logos/history/", () => {
    for (const ranges of Object.values(map)) {
      for (const r of ranges) {
        expect(existsSync(join(ROOT, "public", "logos", "history", r.file))).toBe(true);
      }
    }
  });
});
