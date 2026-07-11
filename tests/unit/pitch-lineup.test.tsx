import { screen } from "@testing-library/react";
import { renderWithIntl } from "./_helpers/intl";
import { describe, expect, it } from "vitest";

import { PitchLineup } from "@/features/leagues/components/PitchLineup";
import type { FixtureDetail, FixtureLineup, LineupPlayerSlot } from "@/types/api";

const slot = (id: number, name: string, grid: string | null, number: number): LineupPlayerSlot => ({
  player: { id, name, number, pos: null, grid },
});

const buildLineup = (
  teamId: number,
  teamName: string,
  startXI: LineupPlayerSlot[],
): FixtureLineup => ({
  team: { id: teamId, name: teamName, logo: "x" },
  coach: { id: 1, name: "C", photo: null },
  formation: "4-3-3",
  startXI,
  substitutes: [slot(99, "Sub", null, 16)],
});

const buildFixture = () =>
  ({
    fixture: {
      id: 1,
      referee: null,
      timezone: "UTC",
      date: "2024-08-16T19:00:00+00:00",
      timestamp: 0,
      periods: { first: null, second: null },
      venue: { id: null, name: null, city: null },
      status: { long: "x", short: "FT", elapsed: 90, extra: null },
    },
    league: {
      id: 39,
      name: "PL",
      country: "England",
      logo: "x",
      flag: null,
      season: 2024,
      round: "Regular Season - 1",
      standings: true,
    },
    teams: {
      home: { id: 10, name: "Home", logo: "x", winner: true },
      away: { id: 20, name: "Away", logo: "x", winner: false },
    },
    goals: { home: 2, away: 1 },
    score: {
      halftime: { home: 1, away: 0 },
      fulltime: { home: 2, away: 1 },
      extratime: { home: null, away: null },
      penalty: { home: null, away: null },
    },
  }) as unknown as FixtureDetail["fixture"];

describe("PitchLineup", () => {
  it("renders all 11 starters from a 4-3-3 home lineup as circles on the pitch", () => {
    const startXI: LineupPlayerSlot[] = [
      slot(1, "GK", "1:1", 1),
      slot(2, "RB", "2:1", 2),
      slot(3, "CB", "2:2", 3),
      slot(4, "CB", "2:3", 4),
      slot(5, "LB", "2:4", 5),
      slot(6, "DM", "3:1", 6),
      slot(7, "CM", "3:2", 7),
      slot(8, "AM", "3:3", 8),
      slot(9, "RW", "4:1", 9),
      slot(10, "ST", "4:2", 10),
      slot(11, "LW", "4:3", 11),
    ];
    const detail = {
      fixture: buildFixture(),
      lineups: [buildLineup(10, "Home", startXI), buildLineup(20, "Away", [])],
      statistics: [],
      events: [],
    } satisfies FixtureDetail;

    const { container } = renderWithIntl(<PitchLineup detail={detail} />);
    const circles = container.querySelectorAll("circle[data-player-id]");
    expect(circles.length).toBe(11);
  });

  it("renders an empty-state when lineups have not been published", () => {
    const detail = {
      fixture: buildFixture(),
      lineups: [],
      statistics: [],
      events: [],
    } satisfies FixtureDetail;
    renderWithIntl(<PitchLineup detail={detail} />);
    expect(screen.getByRole("status", { name: /closer to kickoff/i })).toBeInTheDocument();
  });

  it("renders the captain badge + manager line (TASK-M21)", () => {
    const captain: LineupPlayerSlot = {
      player: {
        id: 1,
        name: "Bruno Fernandes",
        number: 8,
        pos: null,
        grid: "3:2",
        isCaptain: true,
      },
    };
    const home: FixtureLineup = {
      team: { id: 10, name: "Home", logo: "x" },
      coach: { id: 0, name: "Erik ten Hag", photo: null },
      formation: "4-3-3",
      startXI: [slot(2, "Onana", "1:1", 1), captain],
      substitutes: [],
    };
    const detail = {
      fixture: buildFixture(),
      lineups: [home, buildLineup(20, "Away", [])],
      statistics: [],
      events: [],
    } satisfies FixtureDetail;

    const { container } = renderWithIntl(<PitchLineup detail={detail} />);
    // SVG captain marker on the pitch.
    expect(container.querySelector("[data-captain]")).not.toBeNull();
    // Manager line for the home side.
    expect(screen.getByText("Erik ten Hag")).toBeInTheDocument();
  });

  it("paints the player dots with the team kit color when a kit is set (TASK-M47)", () => {
    const home: FixtureLineup = {
      team: { id: 10, name: "Home", logo: "x" },
      coach: { id: 0, name: "", photo: null },
      formation: "4-3-3",
      startXI: [slot(1, "GK", "1:1", 1)],
      substitutes: [],
      kit: { fill: "#DA291C", text: "#ffffff" },
    };
    const detail = {
      fixture: buildFixture(),
      lineups: [home, buildLineup(20, "Away", [])],
      statistics: [],
      events: [],
    } satisfies FixtureDetail;

    const { container } = renderWithIntl(<PitchLineup detail={detail} />);
    const dot = container.querySelector("circle[data-player-id]") as SVGCircleElement;
    // React renders the kit fill as an inline style on the dot.
    expect((dot.getAttribute("style") ?? "").toLowerCase()).toContain("da291c");
  });

  it("renders no captain marker / manager line when absent", () => {
    const managerless = (teamId: number, name: string): FixtureLineup => ({
      team: { id: teamId, name, logo: "x" },
      coach: { id: 0, name: "", photo: null }, // no manager
      formation: "4-3-3",
      startXI: [slot(teamId, "GK", "1:1", 1)],
      substitutes: [],
    });
    const detail = {
      fixture: buildFixture(),
      lineups: [managerless(10, "Home"), managerless(20, "Away")],
      statistics: [],
      events: [],
    } satisfies FixtureDetail;

    const { container } = renderWithIntl(<PitchLineup detail={detail} />);
    expect(container.querySelector("[data-captain]")).toBeNull();
    expect(screen.queryByText(/Manager:/)).not.toBeInTheDocument();
  });

  it("links a resolved player (pitch) + manager to their pages (M21)", () => {
    const home: FixtureLineup = {
      team: { id: 10, name: "Home", logo: "x" },
      coach: { id: 0, name: "Erik ten Hag", photo: null, managerId: "999" },
      formation: "4-3-3",
      startXI: [
        {
          player: {
            id: 5,
            name: "Bruno Fernandes",
            number: 8,
            pos: null,
            grid: "3:2",
            profileId: 1000208,
          },
        },
      ],
      substitutes: [],
    };
    const detail = {
      fixture: buildFixture(),
      lineups: [home, buildLineup(20, "Away", [])],
      statistics: [],
      events: [],
    } satisfies FixtureDetail;

    const { container } = renderWithIntl(<PitchLineup detail={detail} season={2024} />);
    // Pitch dot surname links to the player profile.
    expect(container.querySelector('a[href="/players/1000208?season=2024"]')).not.toBeNull();
    // Manager line links to the manager profile.
    expect(screen.getByRole("link", { name: "Erik ten Hag" })).toHaveAttribute(
      "href",
      "/managers/999?season=2024",
    );
  });

  it("skips players with no parseable grid (places them on the bench instead)", () => {
    const startXI: LineupPlayerSlot[] = [
      slot(1, "GK", "1:1", 1),
      slot(2, "MysteryPlayer", null, 7),
    ];
    const detail = {
      fixture: buildFixture(),
      lineups: [buildLineup(10, "Home", startXI), buildLineup(20, "Away", [])],
      statistics: [],
      events: [],
    } satisfies FixtureDetail;

    const { container } = renderWithIntl(<PitchLineup detail={detail} />);
    expect(container.querySelectorAll("circle[data-player-id]").length).toBe(1);
    expect(screen.getByText(/MysteryPlayer/)).toBeInTheDocument();
  });
});
