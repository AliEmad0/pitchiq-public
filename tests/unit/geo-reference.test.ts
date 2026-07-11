import { describe, expect, it } from "vitest";

import { GEO_REFERENCE } from "@/data/geo-reference";
import { getAvailableSeasons, loadStandings } from "@/data/loaders";

describe("GEO_REFERENCE", () => {
  it("covers exactly the set of clubs that ever appear in committed standings", async () => {
    const seasons = await getAvailableSeasons();
    const standings = await Promise.all(seasons.map((s) => loadStandings(s)));
    const realIds = new Set<number>();
    const nameById = new Map<number, string>();
    for (const rows of standings) {
      for (const r of rows ?? []) {
        realIds.add(r.teamId);
        nameById.set(r.teamId, r.teamName);
      }
    }
    const geoIds = new Set(GEO_REFERENCE.map((g) => g.teamId));

    const missing = [...realIds].filter((id) => !geoIds.has(id));
    const extra = [...geoIds].filter((id) => !realIds.has(id));
    // When red, `missing` lists every "id name" still to place.
    expect({ missing: missing.map((id) => `${id} ${nameById.get(id)}`), extra }).toEqual({
      missing: [],
      extra: [],
    });
  });

  it("has no duplicate ids and all coords/regions in range", () => {
    const ids = GEO_REFERENCE.map((g) => g.teamId);
    expect(new Set(ids).size).toBe(ids.length);
    const REGION_IDS = new Set([
      "UKC",
      "UKD",
      "UKE",
      "UKF",
      "UKG",
      "UKH",
      "UKI",
      "UKJ",
      "UKK",
      "UKL",
    ]);
    for (const g of GEO_REFERENCE) {
      expect(g.x).toBeGreaterThanOrEqual(0);
      expect(g.x).toBeLessThanOrEqual(100);
      expect(g.y).toBeGreaterThanOrEqual(0);
      expect(g.y).toBeLessThanOrEqual(100);
      expect(g.city.length).toBeGreaterThan(0);
      expect(g.region.length).toBeGreaterThan(0);
      expect(REGION_IDS.has(g.regionId)).toBe(true);
    }
  });
});
