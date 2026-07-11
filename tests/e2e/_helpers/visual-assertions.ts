import { expect, type Locator, type Page } from "@playwright/test";

/**
 * Read a locator's computed `prop` color and normalise it to sRGB `[r, g, b]`.
 *
 * The conversion happens in the browser via a 1×1 canvas: Blink parses whatever
 * the computed value is — Tailwind v4 emits `oklch(...)`, our CSS tokens are
 * hex, transparent comes back as `rgba(0,0,0,0)` — and rasterises it to rgb.
 * That sidesteps having to parse every CSS color syntax in Node.
 */
async function readRgb(locator: Locator, prop: string): Promise<[number, number, number]> {
  return locator.evaluate((el, p) => {
    const raw = getComputedStyle(el as Element).getPropertyValue(p);
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = raw;
    ctx.fillRect(0, 0, 1, 1);
    const d = ctx.getImageData(0, 0, 1, 1).data;
    return [d[0], d[1], d[2]] as [number, number, number];
  }, prop);
}

/**
 * Assert a locator's computed `prop` color is within `tol` per channel of the
 * expected sRGB `[r, g, b]`. Tolerance survives sub-shade palette tweaks +
 * oklch→sRGB gamut rounding; any alpha is ignored.
 */
export async function expectCssColorInRange(
  locator: Locator,
  prop: string,
  expected: [number, number, number],
  tol = 20,
): Promise<void> {
  const [r, g, b] = await readRgb(locator, prop);
  const [er, eg, eb] = expected;
  const within = Math.abs(r - er) <= tol && Math.abs(g - eg) <= tol && Math.abs(b - eb) <= tol;
  expect(
    within,
    `Expected ${prop} ≈ rgb(${er}, ${eg}, ${eb}) ±${tol}, got rgb(${r}, ${g}, ${b})`,
  ).toBe(true);
}

/** Read a CSS custom property off :root (the active theme's authored value). */
export async function getCssVar(page: Page, name: string): Promise<string> {
  const raw = await page.evaluate(
    (n) => getComputedStyle(document.documentElement).getPropertyValue(n),
    name,
  );
  return raw.trim();
}
