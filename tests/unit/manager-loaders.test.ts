import { describe, it, expect } from "vitest";

import { managerSeasonsFrom, mergeManagerBioMaps } from "../../src/data/loaders";
import type { ManagersFile } from "../../src/data/schemas";

const E = (id: string, name: string) => ({
  id,
  name,
  matches: 1,
  win: 1,
  draw: 0,
  loss: 0,
  gf: 1,
  ga: 0,
});

const FIXTURE: ManagersFile = {
  "2008": { "33": [E("58", "AF")] },
  "2010": { "45": [E("85", "DM")] },
  "2009": { "33": [E("58", "AF")] },
};

describe("managerSeasonsFrom", () => {
  it("returns the seasons a manager appears in, newest-first", () => {
    expect(managerSeasonsFrom(FIXTURE, "58")).toEqual([2009, 2008]);
  });

  it("returns a single season for a one-club manager", () => {
    expect(managerSeasonsFrom(FIXTURE, "85")).toEqual([2010]);
  });

  it("returns [] for an unknown id", () => {
    expect(managerSeasonsFrom(FIXTURE, "999")).toEqual([]);
  });
});

describe("mergeManagerBioMaps", () => {
  it("a nationality-only override does NOT wipe the auto DOB", () => {
    const auto = { "37659": { birthDate: "1964-06-15", dateOfDeath: null } };
    const overrides = {
      "37659": {
        birthDate: null,
        dateOfDeath: null,
        nationality: "Denmark",
        nationalityCode: "dk",
      },
    };
    expect(mergeManagerBioMaps(auto, overrides)["37659"]).toEqual({
      birthDate: "1964-06-15",
      dateOfDeath: null,
      nationality: "Denmark",
      nationalityCode: "dk",
      photo: null,
    });
  });

  it("override non-null fields win; new ids are added", () => {
    const auto = { "1": { birthDate: "1970-01-01", dateOfDeath: null, nationalityCode: "gb" } };
    const overrides = {
      "1": { birthDate: "1971-02-02", dateOfDeath: null, photo: "https://x/a.jpg" },
      "2": { birthDate: null, dateOfDeath: null, nationality: "Spain", nationalityCode: "es" },
    };
    const out = mergeManagerBioMaps(auto, overrides);
    expect(out["1"]).toEqual({
      birthDate: "1971-02-02",
      dateOfDeath: null,
      nationality: null,
      nationalityCode: "gb",
      photo: "https://x/a.jpg",
    });
    expect(out["2"].nationalityCode).toBe("es");
  });
});
