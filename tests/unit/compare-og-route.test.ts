import { describe, expect, it } from "vitest";

import * as compareRoute from "@/app/api/og/compare/route";

// Shape test: rendering the OG PNG needs Satori fonts + loader reads, verified
// live. Pin the route contract so a config drift is caught.
describe("compare OG route", () => {
  it("is a nodejs GET handler", () => {
    expect(compareRoute.runtime).toBe("nodejs");
    expect(typeof compareRoute.GET).toBe("function");
  });
});
