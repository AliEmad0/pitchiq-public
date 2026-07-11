import { describe, it, expect } from "vitest";

import { luminance, contrastingText, resolveKit } from "@/utils/kit-color";

describe("luminance", () => {
  it("is ~0 for black and ~1 for white", () => {
    expect(luminance("#000000")).toBeCloseTo(0, 5);
    expect(luminance("#ffffff")).toBeCloseTo(1, 5);
  });

  it("returns 0 for a malformed hex", () => {
    expect(luminance("nope")).toBe(0);
  });
});

describe("contrastingText", () => {
  it("picks dark text on light kits (white, yellow)", () => {
    expect(contrastingText("#ffffff")).toBe("#111111");
    expect(contrastingText("#FFF200")).toBe("#111111"); // Norwich yellow
  });

  it("picks white text on dark/saturated kits (red, navy, black)", () => {
    expect(contrastingText("#DA291C")).toBe("#ffffff"); // Man Utd red
    expect(contrastingText("#131C4E")).toBe("#ffffff"); // Spurs navy
    expect(contrastingText("#000000")).toBe("#ffffff");
  });
});

describe("resolveKit", () => {
  it("returns the fill plus a contrasting text color", () => {
    expect(resolveKit("#C8102E")).toEqual({ fill: "#C8102E", text: "#ffffff" });
    expect(resolveKit("#FFFFFF")).toEqual({ fill: "#FFFFFF", text: "#111111" });
  });
});
