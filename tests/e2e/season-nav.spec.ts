import { test, expect } from "@playwright/test";

// The header nav must preserve the active ?season= when navigating between
// sections (don't reset the season). TASK-M25 follow-up; updated for the
// Phase 15 segmented-pill nav (TASK-1502) where secondary sections (Managers /
// Leaderboards / Map) live in a "More" dropdown.
test.describe("Season preserved across nav", () => {
  test("clicking a primary pill link carries the active season", async ({ page }) => {
    await page.goto("/?season=2003");

    // Scope to the header "Primary" nav — the footer also links Teams/Players.
    const nav = page.getByRole("navigation", { name: "Primary" });
    await nav.getByRole("link", { name: "Teams", exact: true }).click();
    await expect(page).toHaveURL(/\/teams\?season=2003$/);

    // …and it keeps carrying across a second hop (Players is also a pill link).
    await nav.getByRole("link", { name: "Players", exact: true }).click();
    await expect(page).toHaveURL(/\/players\?season=2003$/);
  });

  test("the 'More' dropdown links also carry the active season", async ({ page }) => {
    await page.goto("/?season=2003");
    await page.getByRole("button", { name: /more sections/i }).click();
    await page.getByRole("menuitem", { name: "Managers" }).click();
    await expect(page).toHaveURL(/\/managers\?season=2003$/);
  });

  test("the default season keeps clean URLs (no ?season=)", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Primary" });
    await nav.getByRole("link", { name: "Teams", exact: true }).click();
    await expect(page).toHaveURL(/\/teams$/);
  });
});
