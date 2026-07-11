import { describe, expect, it } from "vitest";

import { bidiIsolate, formatNumber, formatOrdinal, isRtl, localizeDigits } from "@/utils/format";

const LRI = String.fromCodePoint(0x2066); // LEFT-TO-RIGHT ISOLATE
const PDI = String.fromCodePoint(0x2069); // POP DIRECTIONAL ISOLATE

describe("isRtl", () => {
  it("is true for ar and ar-EG", () => {
    expect(isRtl("ar")).toBe(true);
    expect(isRtl("ar-EG")).toBe(true);
  });
  it("is false for en / en-GB", () => {
    expect(isRtl("en")).toBe(false);
    expect(isRtl("en-GB")).toBe(false);
  });
});

describe("bidiIsolate", () => {
  it("wraps in LRI...PDI for RTL locales", () => {
    expect(bidiIsolate("2025-26", "ar")).toBe(`${LRI}2025-26${PDI}`);
  });
  it("returns the value untouched for LTR locales", () => {
    expect(bidiIsolate("2025-26", "en")).toBe("2025-26");
  });
});

describe("localizeDigits", () => {
  it("transliterates ASCII digits to Eastern-Arabic for RTL", () => {
    expect(localizeDigits("3-0", "ar")).toBe("٣-٠");
    expect(localizeDigits("35 (2)", "ar")).toBe("٣٥ (٢)");
    expect(localizeDigits(2025, "ar")).toBe("٢٠٢٥");
  });
  it("is a no-op for LTR locales", () => {
    expect(localizeDigits("3-0", "en")).toBe("3-0");
    expect(localizeDigits(2025, "en")).toBe("2025");
  });
});

describe("formatOrdinal", () => {
  it("uses English numeric suffixes", () => {
    expect(formatOrdinal(1, "en")).toBe("1st");
    expect(formatOrdinal(2, "en")).toBe("2nd");
    expect(formatOrdinal(3, "en")).toBe("3rd");
    expect(formatOrdinal(11, "en")).toBe("11th");
    expect(formatOrdinal(20, "en")).toBe("20th");
  });
  it("uses Arabic ordinal words", () => {
    expect(formatOrdinal(1, "ar")).toBe("الأول");
    expect(formatOrdinal(2, "ar")).toBe("الثاني");
    expect(formatOrdinal(4, "ar")).toBe("الرابع");
    expect(formatOrdinal(20, "ar")).toBe("العشرون");
  });
});

describe("formatNumber", () => {
  it("uses Latin digits + comma grouping in English", () => {
    expect(formatNumber(73297, "en")).toBe("73,297");
  });
  it("uses Eastern-Arabic digits with a Latin baseline comma in Arabic, bidi-isolated", () => {
    // Owner: group with the familiar bottom comma, NOT the CLDR Arabic high
    // separator (U+066C ٬).
    expect(formatNumber(73297, "ar")).toBe(`${LRI}٧٣,٢٩٧${PDI}`);
    // sanity: the Arabic form uses Eastern-Arabic digits, not ASCII
    expect(formatNumber(73297, "ar")).toContain("٧");
    expect(formatNumber(73297, "ar")).not.toContain("7");
    // Latin baseline comma, not the Arabic thousands separator.
    expect(formatNumber(73297, "ar")).toContain(",");
    expect(formatNumber(73297, "ar")).not.toContain("٬");
  });
  it("defaults to English (no isolate)", () => {
    expect(formatNumber(1000)).toBe("1,000");
  });
});
