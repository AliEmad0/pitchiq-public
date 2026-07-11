import { describe, it, expect } from "vitest";
import { ageBetween, ageNow, isoToday, seedAge, formatBirthDate } from "@/utils/age";
import { localizeDigits } from "@/utils/format";

describe("ageBetween", () => {
  it("counts full years; subtracts when the birthday hasn't passed", () => {
    expect(ageBetween("1992-06-15", "2026-06-18")).toBe(34); // birthday passed
    expect(ageBetween("1992-06-15", "2026-06-14")).toBe(33); // day before
    expect(ageBetween("1992-06-15", "2026-06-15")).toBe(34); // on the birthday
    expect(ageBetween("2000-10-25", "2026-01-01")).toBe(25); // earlier in year
  });

  it("returns null on missing/garbage input", () => {
    expect(ageBetween(null, "2026-01-01")).toBeNull();
    expect(ageBetween("1992-06-15", null)).toBeNull();
    expect(ageBetween("nope", "2026-01-01")).toBeNull();
  });
});

describe("ageNow", () => {
  it("uses today for a living player", () => {
    expect(ageNow("1992-06-15", null, new Date("2026-06-18T12:00:00"))).toBe(34);
  });

  it("freezes at the date of death for a deceased player", () => {
    // Diogo Jota: born 1996-12-04, died 2025-07-03 → 28 (had his Dec birthday)
    expect(ageNow("1996-12-04", "2025-07-03", new Date("2026-06-18T12:00:00"))).toBe(28);
  });

  it("returns null with no birth date", () => {
    expect(ageNow(null, null, new Date("2026-06-18"))).toBeNull();
  });
});

describe("seedAge", () => {
  const now = new Date("2026-06-18T12:00:00");
  it("prefers full DOB", () => {
    expect(seedAge("1992-06-15", 1992, null, now)).toBe(34);
  });
  it("falls back to birth year when no full DOB", () => {
    expect(seedAge(null, 1990, null, now)).toBe(36);
  });
  it("uses death year for a year-only deceased player", () => {
    expect(seedAge(null, 1950, "2020-01-01", now)).toBe(70);
  });
  it("returns null with neither", () => {
    expect(seedAge(null, null, null, now)).toBeNull();
  });
});

describe("isoToday", () => {
  it("formats a Date as YYYY-MM-DD", () => {
    expect(isoToday(new Date("2026-06-08T23:30:00"))).toBe("2026-06-08");
  });
});

describe("formatBirthDate", () => {
  it("formats ISO to DD/MM/YYYY (English default, no bidi controls)", () => {
    expect(formatBirthDate("2000-10-25")).toBe("25/10/2000");
    expect(formatBirthDate("2000-10-25", "en")).toBe("25/10/2000");
  });
  it("uses Eastern-Arabic digits in YYYY/MM/DD order (reads day-first RTL) for Arabic", () => {
    // Reversed field order so the numeric island reads day → month → year
    // right-to-left (day adjacent to the ولد label).
    expect(formatBirthDate("2000-10-25", "ar")).toBe(localizeDigits("2000/10/25", "ar"));
    expect(formatBirthDate("2000-10-25", "ar")).toBe("٢٠٠٠/١٠/٢٥");
  });
  it("returns null on null/garbage", () => {
    expect(formatBirthDate(null)).toBeNull();
    expect(formatBirthDate("nope")).toBeNull();
  });
});
