import { describe, expect, it } from "vitest";

import manifest from "@/app/manifest";

describe("web manifest", () => {
  it("is branded PitchIQ with icons + theme color", () => {
    const m = manifest();
    expect(m.name).toBe("PitchIQ");
    expect(m.short_name).toBe("PitchIQ");
    expect(m.theme_color).toBe("#0c0a14");
    expect(m.icons?.length).toBeGreaterThan(0);
  });
});
