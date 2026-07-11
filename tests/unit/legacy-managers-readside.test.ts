import { describe, it, expect } from "vitest";

import { getManagerProfile } from "../../src/features/managers/manager-profile.api";
import { getTeamManagers } from "../../src/features/teams/managers.api";

/**
 * Integration check against the committed legacy data (TASK-M51): the merged
 * loaders surface 1992-2007 managers on the real read paths, cross-era ids unify
 * a manager's career, and legacy titles derive.
 */
describe("legacy managers — read side", () => {
  it("merges Ferguson's legacy + modern career under one id (58) with pre-2008 titles", async () => {
    const profile = await getManagerProfile("58");
    expect(profile).not.toBeNull();
    // Cross-era: a legacy season AND a modern season under the same id.
    expect(profile!.seasons).toContain(1993);
    expect(profile!.seasons).toContain(2008);
    // Legacy titles derive: the inaugural 1992-93 Man Utd title (teamId 33).
    const legacyTitle = profile!.honours.find((h) => h.season === 1992);
    expect(legacyTitle).toBeDefined();
    expect(legacyTitle!.teamId).toBe(33);
  });

  it("surfaces a legacy team's manager on the team page (Man Utd 1993-94)", async () => {
    const managers = await getTeamManagers(1993, 33);
    expect(managers.some((m) => m.name === "Alex Ferguson")).toBe(true);
  });

  it("builds a legacy-only manager's profile under an lm- id", async () => {
    const profile = await getManagerProfile("lm-graham-taylor");
    expect(profile).not.toBeNull();
    expect(profile!.seasons.length).toBeGreaterThan(0);
    expect(profile!.totals.played).toBeGreaterThan(0);
  });
});
