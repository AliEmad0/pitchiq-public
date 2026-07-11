import { afterEach, describe, expect, it } from "vitest";
import { cleanup, screen } from "@testing-library/react";

import { TeamStatsTiles, TeamStatsTilesSkeleton } from "@/features/teams/components/TeamStatsTiles";
import type { TeamStats } from "@/types/api";

import { renderWithIntl } from "./_helpers/intl";

afterEach(() => {
  cleanup();
});

function makeStats(overrides: Partial<TeamStats> = {}): TeamStats {
  return {
    goals: {
      for: { total: { home: 30, away: 27, total: 57 } },
      against: { total: { home: 18, away: 20, total: 38 } },
    },
    clean_sheet: { total: 12 },
    failed_to_score: { total: 4 },
    biggest: { streak: { wins: 5, draws: 2, loses: 3 } },
    lineups: [{ formation: "4-2-3-1", played: 22 }],
    // TASK-M17 aggregate fields.
    longestUnbeaten: 8,
    perGame: { shots: 14.2, shotsOnTarget: 5.1, corners: 6.3, fouls: 10.5 },
    cards: { yellow: 68, red: 3 },
    ...overrides,
  };
}

describe("TeamStatsTiles", () => {
  it("renders all twelve tiles with the documented labels", () => {
    renderWithIntl(<TeamStatsTiles stats={makeStats()} />);
    expect(screen.getByText("Goals for")).toBeTruthy();
    expect(screen.getByText("Goals against")).toBeTruthy();
    expect(screen.getByText("Clean sheets")).toBeTruthy();
    expect(screen.getByText("Failed to score")).toBeTruthy();
    expect(screen.getByText("Biggest win streak")).toBeTruthy();
    expect(screen.getByText("Biggest losing streak")).toBeTruthy();
    expect(screen.getByText("Longest unbeaten")).toBeTruthy();
    expect(screen.getByText("Avg shots")).toBeTruthy();
    expect(screen.getByText("Avg shots on target")).toBeTruthy();
    expect(screen.getByText("Avg corners")).toBeTruthy();
    expect(screen.getByText("Avg fouls")).toBeTruthy();
    expect(screen.getByText("Yellow cards")).toBeTruthy();
  });

  it("reads each tile's value from the corresponding TeamStats path", () => {
    renderWithIntl(<TeamStatsTiles stats={makeStats()} />);
    expect(screen.getByText("57")).toBeTruthy(); // goals.for.total.total
    expect(screen.getByText("38")).toBeTruthy(); // goals.against.total.total
    expect(screen.getByText("12")).toBeTruthy(); // clean_sheet.total
    expect(screen.getByText("4")).toBeTruthy(); // failed_to_score.total
    expect(screen.getByText("5")).toBeTruthy(); // biggest.streak.wins
    expect(screen.getByText("3")).toBeTruthy(); // biggest.streak.loses
    expect(screen.getByText("8")).toBeTruthy(); // longestUnbeaten
    expect(screen.getByText("14.2")).toBeTruthy(); // perGame.shots
    expect(screen.getByText("5.1")).toBeTruthy(); // perGame.shotsOnTarget
    expect(screen.getByText("6.3")).toBeTruthy(); // perGame.corners
    expect(screen.getByText("10.5")).toBeTruthy(); // perGame.fouls
    expect(screen.getByText("68")).toBeTruthy(); // cards.yellow
  });

  it("renders em-dash when a value is null", () => {
    const stats = makeStats({
      goals: {
        for: { total: { home: null, away: null, total: null } },
        against: { total: { home: null, away: null, total: null } },
      },
      clean_sheet: { total: null },
      failed_to_score: { total: null },
      biggest: { streak: { wins: null, draws: null, loses: null } },
      longestUnbeaten: null,
      perGame: { shots: null, shotsOnTarget: null, corners: null, fouls: null },
      cards: { yellow: null, red: null },
    });
    renderWithIntl(<TeamStatsTiles stats={stats} />);
    // 12 em-dashes — one per tile.
    expect(screen.getAllByText("—").length).toBe(12);
  });

  it("renders em-dash for the aggregate tiles when those fields are absent (e.g. pre-2000)", () => {
    const stats = makeStats({ longestUnbeaten: undefined, perGame: undefined, cards: undefined });
    renderWithIntl(<TeamStatsTiles stats={stats} />);
    // The 6 aggregate tiles fall back to "—" when the optional fields are missing.
    expect(screen.getAllByText("—").length).toBe(6);
  });

  it("formats large values with en-GB thousand separators", () => {
    const stats = makeStats({
      goals: {
        for: { total: { home: null, away: null, total: 1234 } },
        against: { total: { home: null, away: null, total: 5678 } },
      },
    });
    renderWithIntl(<TeamStatsTiles stats={stats} />);
    expect(screen.getByText("1,234")).toBeTruthy();
    expect(screen.getByText("5,678")).toBeTruthy();
  });

  it("tints each populated tile by its value (stat heat grid); the largest value is hottest (TASK-1506)", () => {
    const { container } = renderWithIntl(<TeamStatsTiles stats={makeStats()} />);
    // Yellow cards (68) is the largest value in makeStats → hottest tile.
    expect(container.querySelector('[data-heat="100"]')).not.toBeNull();
    // All twelve populated tiles carry a numeric heat.
    expect(container.querySelectorAll("li[data-heat]").length).toBe(12);
  });

  it("leaves null-value tiles untinted (no data-heat)", () => {
    const stats = makeStats({ longestUnbeaten: undefined, perGame: undefined, cards: undefined });
    const { container } = renderWithIntl(<TeamStatsTiles stats={stats} />);
    // The 6 aggregate tiles are null → untinted; the 6 populated ones carry heat.
    expect(container.querySelectorAll("li[data-heat]").length).toBe(6);
  });

  it("renders the tile list with the responsive grid column classes", () => {
    const { container } = renderWithIntl(<TeamStatsTiles stats={makeStats()} />);
    const list = container.querySelector("ul");
    expect(list).not.toBeNull();
    expect(list!.className).toContain("grid-cols-2");
    expect(list!.className).toContain("sm:grid-cols-3");
    expect(list!.className).toContain("lg:grid-cols-6");
  });
});

describe("TeamStatsTilesSkeleton", () => {
  it("renders twelve placeholder tiles in the same responsive grid", () => {
    const { container } = renderWithIntl(<TeamStatsTilesSkeleton />);
    const list = container.querySelector("ul");
    expect(list).not.toBeNull();
    expect(list!.children.length).toBe(12);
    expect(list!.className).toContain("grid-cols-2");
    expect(list!.className).toContain("sm:grid-cols-3");
    expect(list!.className).toContain("lg:grid-cols-6");
  });

  it("carries role=status for assistive-tech loading announcement", () => {
    const { container } = renderWithIntl(<TeamStatsTilesSkeleton />);
    expect(container.querySelector("[role='status']")).not.toBeNull();
  });
});
