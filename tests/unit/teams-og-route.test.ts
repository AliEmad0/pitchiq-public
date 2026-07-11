import { describe, expect, it } from "vitest";

import * as route from "@/app/api/og/teams/route";

// Shape test: rendering the OG PNG needs Satori fonts + crest fetches, verified
// live. Here we pin the route contract so a config drift (wrong runtime, no
// GET) is caught.
describe("teams OG route", () => {
  it("is a nodejs GET route handler", () => {
    expect(route.runtime).toBe("nodejs");
    expect(typeof route.GET).toBe("function");
  });
});
