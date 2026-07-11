import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { MOTION_DURATION, MOTION_EASE, cssEase } from "@/utils/motion";

// CSS is the source of truth for motion token VALUES; src/utils/motion.ts is
// the JS mirror. This test parses globals.css so the two can never drift
// (same guard philosophy as the i18n catalog-parity test).
const css = readFileSync(path.resolve(__dirname, "../../src/app/globals.css"), "utf8");

function cssVar(name: string): string {
  const m = css.match(new RegExp(`${name}:\\s*([^;]+);`));
  if (!m) throw new Error(`token ${name} not found in globals.css`);
  return m[1].trim();
}

describe("motion token parity (globals.css ↔ motion.ts)", () => {
  it("mirrors the duration tokens", () => {
    expect(cssVar("--motion-duration-fast")).toBe(`${MOTION_DURATION.fast}ms`);
    expect(cssVar("--motion-duration-base")).toBe(`${MOTION_DURATION.base}ms`);
    expect(cssVar("--motion-duration-slow")).toBe(`${MOTION_DURATION.slow}ms`);
  });

  it("mirrors the easing tokens", () => {
    expect(cssVar("--ease-out-soft")).toBe(cssEase(MOTION_EASE.outSoft));
    expect(cssVar("--ease-in-out-soft")).toBe(cssEase(MOTION_EASE.inOutSoft));
    expect(cssVar("--ease-pop")).toBe(cssEase(MOTION_EASE.pop));
  });

  it("cssEase renders a cubic-bezier() string", () => {
    expect(cssEase([0.25, 1, 0.5, 1])).toBe("cubic-bezier(0.25, 1, 0.5, 1)");
  });
});

describe("loadMotion", () => {
  it("dynamic-imports the vanilla motion entry (animate available)", async () => {
    const { loadMotion } = await import("@/utils/motion");
    const mod = await loadMotion();
    expect(typeof mod.animate).toBe("function");
  });
});
