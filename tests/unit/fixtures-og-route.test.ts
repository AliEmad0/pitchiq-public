import { describe, expect, it } from "vitest";

import * as fixtureRoute from "@/app/api/og/fixture/route";
import * as fixturesRoute from "@/app/api/og/fixtures/route";

// Shape tests: rendering the OG PNG needs Satori fonts + crest fetches, verified
// live. Pin the route contracts so a config drift is caught.
describe("fixtures + fixture OG routes", () => {
  it("fixtures index route is a nodejs GET handler", () => {
    expect(fixturesRoute.runtime).toBe("nodejs");
    expect(typeof fixturesRoute.GET).toBe("function");
  });
  it("fixture detail route is a nodejs GET handler", () => {
    expect(fixtureRoute.runtime).toBe("nodejs");
    expect(typeof fixtureRoute.GET).toBe("function");
  });
});
