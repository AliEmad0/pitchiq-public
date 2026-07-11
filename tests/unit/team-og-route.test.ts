import { describe, expect, it } from "vitest";

import * as route from "@/app/api/og/team/route";

// Shape test: rendering the OG PNG needs Satori fonts + crest fetches, verified
// live. Pin the route contract so a config drift is caught.
describe("team OG route", () => {
  it("is a nodejs GET route handler", () => {
    expect(route.runtime).toBe("nodejs");
    expect(typeof route.GET).toBe("function");
  });
});
