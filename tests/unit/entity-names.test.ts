import { describe, expect, it, vi } from "vitest";

import { IDENTITY_NAMES, makeEntityNames, type ArMaps } from "@/features/i18n/entity-names";

vi.mock("next-intl/server", () => ({ getLocale: vi.fn(async () => "ar") }));
vi.mock("@/data/loaders", () => ({
  loadArTeamNames: vi.fn(async () => ({ "33": "مانشستر يونايتد" })),
  loadArPlayerNames: vi.fn(async () => ({})),
  loadArManagerNames: vi.fn(async () => ({})),
  loadArVenueNames: vi.fn(async () => ({})),
  loadArCityNames: vi.fn(async () => ({})),
  loadArRefereeNames: vi.fn(async () => ({})),
  loadArPositionNames: vi.fn(async () => ({ Goalkeeper: "حارس مرمى" })),
  loadArNationalityOverrides: vi.fn(async () => ({ "gb-eng": "إنجلترا" })),
}));

const maps: ArMaps = {
  teams: { "33": "مانشستر يونايتد" },
  players: { "1001119": "محمد صلاح" },
  managers: { "58": "أليكس فيرغسون" },
  venues: { "33": "أولد ترافورد" },
  cities: { "33": "مانشستر" },
  referees: { "michael oliver": "مايكل أوليفر" },
  positions: { Goalkeeper: "حارس مرمى", Forward: "مهاجم" },
  nationalities: { "gb-eng": "إنجلترا" },
};

describe("makeEntityNames on /ar", () => {
  const L = makeEntityNames(maps, "ar");
  it("returns Arabic team name when mapped", () => {
    expect(L.team(33, "Manchester United")).toBe("مانشستر يونايتد");
  });
  it("falls back to Latin when unmapped", () => {
    expect(L.team(99, "Luton Town")).toBe("Luton Town");
  });
  it("resolves player by numeric id", () => {
    expect(L.player(1001119, "Mohamed Salah")).toBe("محمد صلاح");
  });
  it("resolves manager by string id", () => {
    expect(L.manager("58", "Alex Ferguson")).toBe("أليكس فيرغسون");
  });
  it("resolves referee by normalized name", () => {
    expect(L.referee("Michael Oliver")).toBe("مايكل أوليفر");
  });
  it("translates a known position", () => {
    expect(L.position("Goalkeeper")).toBe("حارس مرمى");
  });
  it("uses the nationality override for a home nation", () => {
    expect(L.nationality("gb-eng", "England")).toBe("إنجلترا");
  });
  it("Intl-resolves a plain ISO nationality to a non-empty Arabic string", () => {
    const out = L.nationality("fr", "France");
    expect(out).toBeTruthy();
    expect(out).not.toBe("France");
  });
  it("keeps null referee/position/nationality as fallback", () => {
    expect(L.referee(null)).toBeNull();
    expect(L.position(null)).toBeNull();
    expect(L.nationality(null, "France")).toBe("France");
  });
});

describe("makeEntityNames on /en is identity", () => {
  const L = makeEntityNames(maps, "en");
  it("returns Latin for everything", () => {
    expect(L.team(33, "Manchester United")).toBe("Manchester United");
    expect(L.player(1001119, "Mohamed Salah")).toBe("Mohamed Salah");
    expect(L.position("Goalkeeper")).toBe("Goalkeeper");
    expect(L.nationality("gb-eng", "England")).toBe("England");
    expect(L.isAr).toBe(false);
  });
  it("IDENTITY_NAMES is the shared /en resolver", () => {
    expect(makeEntityNames(maps, "en")).toBe(IDENTITY_NAMES);
  });
});

describe("getEntityNames (locale + loaders)", () => {
  it("builds the resolver from getLocale + the map loaders", async () => {
    const { getEntityNames } = await import("@/features/i18n/entity-names");
    const L = await getEntityNames();
    expect(L.isAr).toBe(true);
    expect(L.team(33, "Manchester United")).toBe("مانشستر يونايتد");
    expect(L.position("Goalkeeper")).toBe("حارس مرمى");
    expect(L.nationality("gb-eng", "England")).toBe("إنجلترا");
  });
});
