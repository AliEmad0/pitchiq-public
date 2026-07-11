import { describe, expect, it } from "vitest";

import { chipClasses, type FormResult } from "@/utils/form-badge";

describe("chipClasses", () => {
  it("returns the success W palette", () => {
    const classes = chipClasses("W");
    expect(classes).toContain("bg-success/15");
    expect(classes).toContain("text-success");
    expect(classes).toContain("ring-success/30");
  });

  it("returns the neutral D palette", () => {
    const classes = chipClasses("D");
    expect(classes).toContain("bg-muted");
    expect(classes).toContain("text-muted-foreground");
    expect(classes).toContain("ring-border");
  });

  it("returns the destructive L palette", () => {
    const classes = chipClasses("L");
    expect(classes).toContain("bg-destructive/15");
    expect(classes).toContain("text-destructive");
    expect(classes).toContain("ring-destructive/30");
  });

  it("uses a distinct palette for each result so the strip never collides visually", () => {
    const results: FormResult[] = ["W", "D", "L"];
    const palettes = new Set(results.map(chipClasses));
    expect(palettes.size).toBe(3);
  });
});
