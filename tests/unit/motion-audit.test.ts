import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

// TASK-1706 — the Phase-17 closeout net. Locks the audit's three invariants:
// (1) every @keyframes in globals.css animates compositor/paint-friendly
// properties only (a `width`/`height`/`top` animation re-lays-out every frame
// — the audit converted boot-rail-grow from exactly that); (2) the
// reduced-motion gates the audit added stay; (3) Motion stays LAZY-ONLY —
// no static `from "motion"` import anywhere in src (the 1701 rule).

const ROOT = path.resolve(__dirname, "../..");
const css = readFileSync(path.join(ROOT, "src/app/globals.css"), "utf8");

/** Properties a keyframe may animate without layout work. */
const KEYFRAME_ALLOWLIST = new Set([
  "opacity",
  "transform",
  "visibility",
  "box-shadow",
  "fill",
  "stroke-dashoffset",
  "background-color",
  "border-color",
]);

function keyframesBlocks(source: string): Array<{ name: string; body: string }> {
  const out: Array<{ name: string; body: string }> = [];
  const re = /@keyframes ([\w-]+)\s*\{/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source))) {
    let depth = 1;
    let i = re.lastIndex;
    while (i < source.length && depth > 0) {
      if (source[i] === "{") depth++;
      else if (source[i] === "}") depth--;
      i++;
    }
    out.push({ name: m[1], body: source.slice(re.lastIndex, i - 1) });
  }
  return out;
}

describe("motion audit (TASK-1706)", () => {
  it("every globals.css @keyframes animates allowlisted properties only", () => {
    const blocks = keyframesBlocks(css);
    expect(blocks.length).toBeGreaterThanOrEqual(9);
    for (const { name, body } of blocks) {
      const props = [...body.matchAll(/([a-z-]+)\s*:/g)].map((p) => p[1]);
      expect(props.length, `@keyframes ${name} declares nothing?`).toBeGreaterThan(0);
      for (const prop of props) {
        expect(
          KEYFRAME_ALLOWLIST.has(prop),
          `@keyframes ${name} animates "${prop}" — a non-allowlisted (likely layout) property`,
        ).toBe(true);
      }
    }
  });

  it("keeps the overlay-entrance + skeleton-pulse reduced-motion gates", () => {
    const reduce = css.match(
      /@media \(prefers-reduced-motion: reduce\)\s*\{\s*\[data-slot="dialog-content"\][^{]+\{[^}]*\}\s*\.animate-pulse\s*\{[^}]*\}/,
    );
    expect(reduce?.[0]).toContain('[data-slot="sheet-content"]');
    expect(reduce?.[0]).toContain("animation: none !important");
  });

  it("Motion has NO static import anywhere in src (lazy-only, TASK-1701)", () => {
    const offenders: string[] = [];
    for (const entry of readdirSync(path.join(ROOT, "src"), {
      recursive: true,
      withFileTypes: true,
    })) {
      if (!entry.isFile() || !/\.(ts|tsx)$/.test(entry.name)) continue;
      const file = path.join(entry.parentPath, entry.name);
      const source = readFileSync(file, "utf8");
      if (/from\s+["']motion(\/|["'])/.test(source)) offenders.push(file);
    }
    expect(offenders).toEqual([]);
  });
});
