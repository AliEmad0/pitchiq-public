import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

// The TASK-1704 reveal is CSS-driven; this guards the load-bearing rules in
// globals.css against an accidental refactor (the motion-tokens parity
// philosophy): the hidden state must stay scoped under the pre-paint gate,
// the failsafe must exist, and reduced motion must fully disable it.
const css = readFileSync(path.resolve(__dirname, "../../src/app/globals.css"), "utf8");

describe("reveal CSS (globals.css)", () => {
  it("hides un-revealed targets ONLY under the pre-paint gate", () => {
    expect(css).toMatch(
      /:root\[data-reveal-ready\] \[data-reveal\]:not\(\[data-revealed\]\)\s*\{\s*opacity:\s*0;/,
    );
    // No hidden state outside the gate — a bare [data-reveal] opacity rule
    // would blank the page for no-JS visitors.
    expect(css).not.toMatch(/^\s*\[data-reveal\][^{]*\{\s*opacity:\s*0/m);
  });

  it("plays reveal-rise on the 1701 tokens with a capped stagger", () => {
    expect(css).toContain("@keyframes reveal-rise");
    const revealed = css.match(
      /:root\[data-reveal-ready\] \[data-reveal\]\[data-revealed\]\s*\{[^}]+\}/,
    );
    expect(revealed?.[0]).toContain("reveal-rise");
    expect(revealed?.[0]).toContain("var(--motion-duration-base)");
    expect(revealed?.[0]).toContain("var(--ease-out-soft)");
    expect(revealed?.[0]).toContain("min(var(--rvi, 0), 12)");
  });

  it("keeps the hydration-death failsafe (gate stamped but controller never ran)", () => {
    expect(css).toMatch(
      /:root\[data-reveal-ready\]:not\(\[data-reveal-live\]\) \[data-reveal\]:not\(\[data-revealed\]\)\s*\{[^}]*reveal-rise/,
    );
  });

  it("disables the reveal entirely under prefers-reduced-motion", () => {
    const reduce = css.match(
      /@media \(prefers-reduced-motion: reduce\)\s*\{\s*:root\[data-reveal-ready\] \[data-reveal\]\s*\{[^}]*\}/,
    );
    expect(reduce?.[0]).toContain("opacity: 1 !important");
    expect(reduce?.[0]).toContain("animation: none !important");
  });
});
