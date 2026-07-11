import { screen, within } from "@testing-library/react";
import { renderWithIntl } from "./_helpers/intl";
import { describe, expect, it } from "vitest";

import { StatComparison } from "@/features/leagues/components/StatComparison";
import type { FixtureStatBlock, FixtureTeams } from "@/types/api";

const TEAMS = {
  home: { id: 10, name: "Home", logo: "x", winner: true },
  away: { id: 20, name: "Away", logo: "x", winner: false },
} as unknown as FixtureTeams;

const block = (id: number, rows: Array<[string, number]>): FixtureStatBlock =>
  ({
    team: { id, name: id === 10 ? "Home" : "Away", logo: "x" },
    statistics: rows.map(([type, value]) => ({ type, value })),
  }) as unknown as FixtureStatBlock;

describe("StatComparison (win arrows)", () => {
  it("renders both values and points the arrow to the higher side", () => {
    const stats = [
      block(10, [
        ["Shots", 19],
        ["Corners", 6],
      ]),
      block(20, [
        ["Shots", 10],
        ["Corners", 7],
      ]),
    ];
    renderWithIntl(<StatComparison statistics={stats} fixtureTeams={TEAMS} />);

    const rows = screen.getAllByRole("listitem");
    // Shots: home wins → home value (19) is the accented one.
    const shots = within(rows[0]);
    expect(shots.getByText("19")).toHaveClass("text-primary");
    expect(shots.getByText("10")).not.toHaveClass("text-primary");
    // Corners: away wins → away value (7) accented.
    const corners = within(rows[1]);
    expect(corners.getByText("7")).toHaveClass("text-primary");
  });

  it("renders an empty-state when there are no statistics", () => {
    renderWithIntl(<StatComparison statistics={[]} fixtureTeams={TEAMS} />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});
