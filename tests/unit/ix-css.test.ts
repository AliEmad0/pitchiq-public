import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

// TASK-1705 "Neon glow" — the interaction-language utilities are CSS-driven;
// guard the load-bearing rules in globals.css (the motion-tokens parity
// philosophy): the glow rides the era accent + the 1701 tokens, and reduced
// motion kills the transform press + the pop entrance.
const css = readFileSync(path.resolve(__dirname, "../../src/app/globals.css"), "utf8");

describe("ix (micro-interaction) CSS (globals.css)", () => {
  it("glows on hover with the era accent, on the fast token", () => {
    const glow = css.match(/:root \.ix-glow\.ix-glow:hover\s*\{[^}]+\}/);
    expect(glow?.[0]).toContain(
      "var(--ix-glow, color-mix(in srgb, var(--primary) 55%, transparent))",
    );
    const base = css.match(/\.ix-glow\s*\{[^}]+\}/);
    expect(base?.[0]).toContain("var(--motion-duration-fast)");
    expect(base?.[0]).toContain("var(--ease-out-soft)");
  });

  it("paints the standings row wash on the CELLS (sticky columns included)", () => {
    expect(css).toMatch(
      /:root \.ix-row:hover :is\(td, th\)\s*\{\s*background-color: color-mix\(in srgb, var\(--primary\) 8%, var\(--card\)\);/,
    );
  });

  it("kills the press transform + pop entrance under prefers-reduced-motion", () => {
    const reduce = css.match(
      /@media \(prefers-reduced-motion: reduce\)\s*\{\s*\.ix-press:active\s*\{[^}]*\}\s*\.ix-pop\s*\{[^}]*\}/,
    );
    expect(reduce?.[0]).toContain("transform: none");
    expect(reduce?.[0]).toContain("animation: none");
  });
});
