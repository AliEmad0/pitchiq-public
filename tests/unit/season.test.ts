import { describe, expect, it } from "vitest";

import {
  EARLIEST_SEASON,
  currentPLSeason,
  formatSeasonLabel,
  getPLSeasons,
  getSeasonState,
  parseSeason,
  seasonFromFixtureId,
  withSeason,
} from "@/utils/season";

describe("seasonFromFixtureId", () => {
  it("maps an Aug–Dec fixture to that calendar year's season", () => {
    expect(seasonFromFixtureId("2024-08-16-MUN-FUL")).toBe(2024);
    expect(seasonFromFixtureId("2016-12-26-LIV-STK")).toBe(2016);
  });
  it("maps a Jan–Jul fixture to the previous year's season", () => {
    expect(seasonFromFixtureId("2025-05-25-BOU-LEI")).toBe(2024);
    expect(seasonFromFixtureId("2011-01-01-ARS-WBA")).toBe(2010);
  });
  it("returns null when the id has no parseable leading date", () => {
    expect(seasonFromFixtureId("not-a-dated-id")).toBeNull();
    expect(seasonFromFixtureId("2024-13-01-X-Y")).toBeNull(); // invalid month
    expect(seasonFromFixtureId("")).toBeNull();
  });
});

describe("currentPLSeason", () => {
  it("returns the calendar year when called in August (start of new season)", () => {
    // Month is 0-indexed; August === 7.
    expect(currentPLSeason(new Date(2024, 7, 1))).toBe(2024);
  });

  it("returns the calendar year for any month from August to December", () => {
    expect(currentPLSeason(new Date(2024, 7, 15))).toBe(2024); // mid-Aug
    expect(currentPLSeason(new Date(2024, 9, 1))).toBe(2024); // Oct
    expect(currentPLSeason(new Date(2024, 11, 31))).toBe(2024); // 31 Dec
  });

  it("returns year-1 for any month from January through July", () => {
    expect(currentPLSeason(new Date(2025, 0, 1))).toBe(2024); // 1 Jan 2025
    expect(currentPLSeason(new Date(2025, 4, 18))).toBe(2024); // 18 May 2025
    expect(currentPLSeason(new Date(2025, 6, 31))).toBe(2024); // 31 Jul 2025
  });

  it("uses the current Date when `now` is omitted", () => {
    // Just confirm the type contract — the value will vary at runtime.
    const value = currentPLSeason();
    expect(Number.isInteger(value)).toBe(true);
    expect(value).toBeGreaterThanOrEqual(EARLIEST_SEASON);
  });
});

describe("parseSeason", () => {
  const fallback = 2024;

  it("returns the fallback when raw is undefined", () => {
    expect(parseSeason(undefined, fallback)).toBe(fallback);
  });

  it("parses a numeric string into a season integer", () => {
    expect(parseSeason("2023", fallback)).toBe(2023);
  });

  it("uses the first entry when raw is an array", () => {
    expect(parseSeason(["2022", "2023"], fallback)).toBe(2022);
  });

  it("falls back when the input is non-numeric", () => {
    expect(parseSeason("abc", fallback)).toBe(fallback);
  });

  it("falls back when the input has a fractional part", () => {
    expect(parseSeason("2024.5", fallback)).toBe(fallback);
  });

  it("falls back when the input is below the earliest supported season", () => {
    expect(parseSeason(String(EARLIEST_SEASON - 1), fallback)).toBe(fallback);
  });

  it("falls back when the input is in the future", () => {
    expect(parseSeason(String(fallback + 1), fallback)).toBe(fallback);
  });

  it("accepts the earliest supported season exactly", () => {
    expect(parseSeason(String(EARLIEST_SEASON), fallback)).toBe(EARLIEST_SEASON);
  });

  it("accepts the fallback as a valid input (upper bound = fallback inclusive)", () => {
    expect(parseSeason(String(fallback), fallback)).toBe(fallback);
  });

  it("accepts 1992 (inaugural-season floor, TASK-1403) and rejects 1991", () => {
    expect(parseSeason("1992", 2025)).toBe(1992);
    expect(parseSeason("1991", 2025)).toBe(2025); // below floor → fallback
  });
});

describe("getPLSeasons", () => {
  it("returns a descending list starting at the current season", () => {
    // Aug 2024 → current season is 2024
    const seasons = getPLSeasons(new Date(2024, 7, 15));
    expect(seasons[0]).toBe(2024);
    // strictly decreasing by 1
    for (let i = 1; i < seasons.length; i++) {
      expect(seasons[i]).toBe(seasons[i - 1] - 1);
    }
  });

  it("includes EARLIEST_SEASON as the last entry (inclusive)", () => {
    const seasons = getPLSeasons(new Date(2024, 7, 15));
    expect(seasons[seasons.length - 1]).toBe(EARLIEST_SEASON);
  });

  it("has length `current − EARLIEST_SEASON + 1`", () => {
    const seasons = getPLSeasons(new Date(2024, 7, 15));
    expect(seasons.length).toBe(2024 - EARLIEST_SEASON + 1);
  });

  it("rolls back to year-1 in the same off-season window as currentPLSeason", () => {
    // 1 May 2025 still belongs to the 2024-25 season → list starts at 2024
    const seasons = getPLSeasons(new Date(2025, 4, 1));
    expect(seasons[0]).toBe(2024);
  });

  it("uses the current Date when `now` is omitted", () => {
    const seasons = getPLSeasons();
    expect(seasons[0]).toBe(currentPLSeason());
  });
});

describe("formatSeasonLabel", () => {
  it("renders a standard PL season as `YYYY-YY`", () => {
    expect(formatSeasonLabel(2024)).toBe("2024-25");
    expect(formatSeasonLabel(2010)).toBe("2010-11");
  });

  it("zero-pads the next-year suffix across the millennium", () => {
    expect(formatSeasonLabel(2099)).toBe("2099-00");
    expect(formatSeasonLabel(2100)).toBe("2100-01");
  });

  it("returns the bare label for English (default) — no bidi controls", () => {
    expect(formatSeasonLabel(2025)).toBe("2025-26");
    expect(formatSeasonLabel(2025, "en")).toBe("2025-26");
  });

  it("uses a full, spaced Eastern-Arabic range for Arabic (flows RTL — year-first when read)", () => {
    expect(formatSeasonLabel(2025, "ar")).toBe("٢٠٢٥ - ٢٠٢٦");
    // Full second year, not the abbreviated "٢٦".
    expect(formatSeasonLabel(2099, "ar")).toBe("٢٠٩٩ - ٢١٠٠");
  });
});

describe("getSeasonState — TASK-608", () => {
  // `now` is pinned to 2026-06-01T00:00:00Z for these tests so the
  // 2024-25 PL season's fixture dates (Aug 2024 → May 2025) are all
  // squarely in the past and the 2025-26 dates (Aug 2025 → May 2026)
  // are also all in the past relative to this `now`. Future-state tests
  // use a `now` deep in the past.
  const PINNED_NOW = new Date("2026-06-01T00:00:00.000Z");

  it("returns 'unknown' when the fixture list is empty (loader failure / no data)", () => {
    expect(getSeasonState([], PINNED_NOW)).toBe("unknown");
  });

  it("returns 'in-progress' when there's a mix of past and future fixtures", () => {
    const dates = [
      "2026-04-01T15:00:00.000Z", // past
      "2026-05-15T15:00:00.000Z", // past
      "2026-08-15T15:00:00.000Z", // future
      "2026-09-22T15:00:00.000Z", // future
    ];
    expect(getSeasonState(dates, PINNED_NOW)).toBe("in-progress");
  });

  it("returns 'ended' when every fixture is in the past (the live 2024-25 case)", () => {
    const dates = [
      "2024-08-16T20:00:00.000Z",
      "2025-01-15T15:00:00.000Z",
      "2025-05-25T16:00:00.000Z",
    ];
    expect(getSeasonState(dates, PINNED_NOW)).toBe("ended");
  });

  it("returns 'future' when every fixture is in the future (pre-season period)", () => {
    const dates = [
      "2026-08-15T15:00:00.000Z",
      "2026-08-22T15:00:00.000Z",
      "2027-05-24T16:00:00.000Z",
    ];
    expect(getSeasonState(dates, PINNED_NOW)).toBe("future");
  });

  it("treats a fixture exactly equal to `now` as past (boundary case)", () => {
    const sameMoment = PINNED_NOW.toISOString();
    expect(getSeasonState([sameMoment], PINNED_NOW)).toBe("ended");
  });

  it("uses the current Date when `now` is omitted (smoke check — no error)", () => {
    // Just confirm the type contract — picks up real time. With only
    // 2024-25 data committed today (mid-2026), the answer is "ended".
    const state = getSeasonState(["2024-08-16T20:00:00.000Z"]);
    expect(["in-progress", "ended", "future", "unknown"]).toContain(state);
  });
});

describe("withSeason (TASK-M09)", () => {
  it("appends ?season= to a bare href", () => {
    expect(withSeason("/players/900", 2011)).toBe("/players/900?season=2011");
    expect(withSeason("/teams/42", 2025)).toBe("/teams/42?season=2025");
  });

  it("uses & when the href already has a query string", () => {
    expect(withSeason("/compare?a=1", 2011)).toBe("/compare?a=1&season=2011");
  });

  it("leaves the href bare when season is null/undefined", () => {
    expect(withSeason("/teams/42", null)).toBe("/teams/42");
    expect(withSeason("/teams/42", undefined)).toBe("/teams/42");
  });
});
