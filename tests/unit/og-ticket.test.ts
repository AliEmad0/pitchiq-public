import { describe, expect, it } from "vitest";

import { eraTheme } from "../../src/app/api/og/ticket";

describe("eraTheme", () => {
  it("modern is dark + magenta with the logo brand and the built-in font", () => {
    const t = eraTheme("modern");
    expect(t.pageBg).toBe("#0c0a14");
    expect(t.accent).toBe("#e22fd0");
    expect(t.brandMode).toBe("logo");
    expect(t.fontFamily).toBeUndefined();
    expect(t.logoGrad).toEqual(["#e22fd0", "#a3179a"]);
  });

  it("goldenMillennium is navy + cyan, glossy, Rajdhani", () => {
    const t = eraTheme("goldenMillennium");
    expect(t.pageBg).toBe("#0b1422");
    expect(t.accent).toBe("#2fd4ec");
    expect(t.brandMode).toBe("logo");
    expect(t.gloss).toBe(true);
    expect(t.fontFamily).toBe("Rajdhani");
  });

  it("retro90s is cream + claret, ruled, ceefax brand, Oswald", () => {
    const t = eraTheme("retro90s");
    expect(t.pageBg).toBe("#e9e0cb");
    expect(t.accent).toBe("#8f2b25");
    expect(t.text).toBe("#241f16");
    expect(t.brandMode).toBe("ceefax");
    expect(t.ruled).toBe(true);
    expect(t.fontFamily).toBe("Oswald");
    expect(t.logoGrad).toBeNull();
  });
});
