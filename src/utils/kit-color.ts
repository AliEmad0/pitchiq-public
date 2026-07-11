/**
 * Kit-color helpers for the lineup pitch (TASK-M47). Given a club's kit hex,
 * pick a number/text color that reads on it (black on light kits, white on dark)
 * via the WCAG relative-luminance threshold.
 */

/** Parse `#rrggbb` → [r, g, b] in 0-255, or null if malformed. */
function parseHex(hex: string): [number, number, number] | null {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

/** WCAG relative luminance (0 = black, 1 = white). */
export function luminance(hex: string): number {
  const rgb = parseHex(hex);
  if (!rgb) return 0;
  const [r, g, b] = rgb.map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Number/text color that contrasts with a kit fill: near-black on light, white on dark. */
export function contrastingText(hex: string): string {
  // 0.5 threshold splits white/yellow kits (→ dark text) from the rest (→ white).
  return luminance(hex) > 0.5 ? "#111111" : "#ffffff";
}

export type Kit = { fill: string; text: string };

/** Resolve a kit hex into a `{ fill, text }` pair for the pitch dot. */
export function resolveKit(hex: string): Kit {
  return { fill: hex, text: contrastingText(hex) };
}
