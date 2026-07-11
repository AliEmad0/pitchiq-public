import { describe, expect, it } from "vitest";

import { NAV_ITEMS } from "@/components/layout/nav-items";

describe("NAV_ITEMS", () => {
  it("includes a Fixtures link (TASK-M35)", () => {
    expect(NAV_ITEMS.some((i) => i.href === "/fixtures" && i.label === "Fixtures")).toBe(true);
  });

  it("keeps the core entry points", () => {
    const hrefs = NAV_ITEMS.map((i) => i.href);
    expect(hrefs).toEqual(expect.arrayContaining(["/", "/teams", "/fixtures", "/compare"]));
  });

  it("includes the Managers link after Teams (TASK-M49)", () => {
    const labels = NAV_ITEMS.map((i) => i.label);
    expect(labels).toContain("Managers");
    expect(labels.indexOf("Managers")).toBe(labels.indexOf("Teams") + 1);
    expect(NAV_ITEMS.find((i) => i.label === "Managers")?.href).toBe("/managers");
  });

  it("includes the Players link after Managers (TASK-M50)", () => {
    const labels = NAV_ITEMS.map((i) => i.label);
    expect(labels).toContain("Players");
    expect(labels.indexOf("Players")).toBe(labels.indexOf("Managers") + 1);
    expect(NAV_ITEMS.find((i) => i.label === "Players")?.href).toBe("/players");
  });

  it("includes the Leaderboards link after Players (TASK-M18)", () => {
    const labels = NAV_ITEMS.map((i) => i.label);
    expect(labels).toContain("Leaderboards");
    expect(labels.indexOf("Leaderboards")).toBe(labels.indexOf("Players") + 1);
    expect(NAV_ITEMS.find((i) => i.label === "Leaderboards")?.href).toBe("/leaderboards");
  });

  it("includes the Map link (TASK-M27)", () => {
    expect(NAV_ITEMS.some((i) => i.href === "/map" && i.label === "Map")).toBe(true);
  });
});
