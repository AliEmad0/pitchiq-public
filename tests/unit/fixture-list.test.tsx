import { afterEach, describe, expect, it } from "vitest";
import { cleanup, screen, within } from "@testing-library/react";

import { FixtureList, type FixtureListItem } from "@/features/leagues/components/FixtureList";
import type { Fixture } from "@/types/api";

import { renderWithIntl } from "./_helpers/intl";

afterEach(() => {
  cleanup();
});

function item(
  id: string,
  home: string,
  away: string,
  homeGoals: number,
  awayGoals: number,
  badge?: string,
): FixtureListItem {
  const fixture = {
    fixture: {
      id,
      referee: null,
      timezone: "UTC",
      date: "2025-08-15T19:00:00+00:00",
      timestamp: 0,
    },
    teams: {
      home: { id: 40, name: home, logo: "/logos/40.png", winner: homeGoals > awayGoals },
      away: { id: 35, name: away, logo: "/logos/35.png", winner: awayGoals > homeGoals },
    },
    goals: { home: homeGoals, away: awayGoals },
  } as unknown as Fixture;
  return { fixture, badge };
}

describe("FixtureList", () => {
  it("renders a labelled list with one row per fixture", () => {
    renderWithIntl(
      <FixtureList
        season={2025}
        ariaLabel="Classic matches"
        items={[
          item("2025-08-15-LIV-BOU", "Liverpool", "Bournemouth", 4, 2, "7-Goal Thriller"),
          item("2025-08-16-AVL-NEW", "Aston Villa", "Newcastle", 0, 0),
        ]}
      />,
    );
    const list = screen.getByRole("list", { name: /classic matches/i });
    expect(within(list).getAllByRole("listitem")).toHaveLength(2);
  });

  it("shows the catalyst badge when present", () => {
    renderWithIntl(
      <FixtureList
        season={2025}
        ariaLabel="Classic matches"
        items={[item("x", "Liverpool", "Bournemouth", 4, 2, "7-Goal Thriller")]}
      />,
    );
    expect(screen.getByText("7-Goal Thriller")).toBeInTheDocument();
  });

  it("links each team to its season-scoped team page and the score to the match", () => {
    renderWithIntl(
      <FixtureList
        season={2025}
        ariaLabel="Recent results"
        items={[item("2025-08-15-LIV-BOU", "Liverpool", "Bournemouth", 4, 2)]}
      />,
    );
    expect(screen.getByRole("link", { name: /view liverpool page/i })).toHaveAttribute(
      "href",
      "/teams/40?season=2025",
    );
    expect(screen.getByRole("link", { name: /view bournemouth page/i })).toHaveAttribute(
      "href",
      "/teams/35?season=2025",
    );
    expect(screen.getByRole("link", { name: /match details/i })).toHaveAttribute(
      "href",
      "/fixtures/2025-08-15-LIV-BOU",
    );
  });

  it("renders the score centred (home left / away right) — score in the middle grid column", () => {
    renderWithIntl(
      <FixtureList
        season={2025}
        ariaLabel="Recent results"
        items={[item("x", "Liverpool", "Bournemouth", 4, 2)]}
      />,
    );
    const score = screen.getByRole("link", { name: /match details/i });
    expect(score).toHaveTextContent("4–2");
    // The row is a 3-column grid (home | score | away) so scores align row-to-row.
    expect(score.parentElement?.className).toMatch(/grid-cols-\[1fr_auto_1fr\]/);
  });

  it("renders a polite empty state when there are no items", () => {
    renderWithIntl(
      <FixtureList season={2025} ariaLabel="Classic matches" items={[]} emptyMessage="None." />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("None.");
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });
});
