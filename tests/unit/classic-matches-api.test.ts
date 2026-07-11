/**
 * Real-data sanity for `getClassicMatches` against the committed 2024-25
 * snapshot (a completed season → every fixture is a candidate).
 */
import { describe, expect, it } from "vitest";

import { getClassicMatches } from "@/features/leagues/classic-matches.api";

describe("getClassicMatches — snapshot adapter (season 2024)", () => {
  it("returns the top 6 notable matches by default", async () => {
    const result = await getClassicMatches(2024);
    expect(result).not.toBeNull();
    expect(result!.length).toBe(6);
  });

  it("attaches a catalyst badge descriptor (message key) to each pick", async () => {
    const result = await getClassicMatches(2024);
    for (const m of result!) {
      expect(typeof m.badge.key).toBe("string");
      expect(m.badge.key.length).toBeGreaterThan(0);
    }
  });

  it("respects the max-2-per-club diversity guard", async () => {
    const result = await getClassicMatches(2024);
    const counts = new Map<number, number>();
    for (const m of result!) {
      for (const id of [m.fixture.teams.home.id, m.fixture.teams.away.id]) {
        counts.set(id, (counts.get(id) ?? 0) + 1);
      }
    }
    for (const count of counts.values()) {
      expect(count).toBeLessThanOrEqual(2);
    }
  });

  it("returns wire-shaped fixtures linking to real snapshot ids", async () => {
    const result = await getClassicMatches(2024);
    for (const m of result!) {
      expect(typeof m.fixture.fixture.id).toBe("string");
      expect(m.fixture.fixture.id).toMatch(/^\d{4}-\d{2}-\d{2}-[A-Z]{3}-[A-Z]{3}$/);
    }
  });

  it("returns null for a season with no committed snapshot", async () => {
    expect(await getClassicMatches(2099)).toBeNull();
  });
});
