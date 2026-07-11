import { describe, expect, it } from "vitest";

import * as playerRoute from "@/app/api/og/player/route";
import * as playersRoute from "@/app/api/og/players/route";

// Shape tests: rendering the OG PNG needs Satori fonts + headshot fetches,
// verified live. Pin the route contracts so a config drift is caught.
describe("players + player OG routes", () => {
  it("players index route is a nodejs GET handler", () => {
    expect(playersRoute.runtime).toBe("nodejs");
    expect(typeof playersRoute.GET).toBe("function");
  });
  it("player profile route is a nodejs GET handler", () => {
    expect(playerRoute.runtime).toBe("nodejs");
    expect(typeof playerRoute.GET).toBe("function");
  });
});
