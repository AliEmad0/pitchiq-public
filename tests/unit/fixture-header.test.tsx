import { afterEach, describe, expect, it } from "vitest";
import { cleanup, screen } from "@testing-library/react";
import { renderWithIntl } from "./_helpers/intl";

import { FixtureHeader } from "@/features/leagues/components/FixtureHeader";
import type { Fixture, FixtureTeam } from "@/types/api";

afterEach(() => {
  cleanup();
});

function team(overrides: Partial<FixtureTeam> = {}): FixtureTeam {
  return { id: 1, name: "Home Club", logo: "/logos/1.png", winner: null, ...overrides };
}

function makeFixture(overrides: Partial<Fixture> = {}): Fixture {
  return {
    fixture: {
      id: "2024-08-16-MUN-FUL",
      referee: "R Jones",
      timezone: "UTC",
      date: "2024-08-16T19:00:00+00:00",
      timestamp: 0,
      periods: { first: null, second: null },
      venue: { id: null, name: "Old Trafford", city: null },
      status: { long: "Match Finished", short: "FT", elapsed: 90, extra: null },
    },
    league: {
      id: 39,
      name: "Premier League",
      country: "England",
      logo: "",
      flag: null,
      season: 2024,
      round: "",
      standings: true,
    },
    teams: { home: team({ id: 1, name: "Man United" }), away: team({ id: 2, name: "Fulham" }) },
    goals: { home: 1, away: 0 },
    score: {
      halftime: { home: 0, away: 0 },
      fulltime: { home: 1, away: 0 },
      extratime: { home: null, away: null },
      penalty: { home: null, away: null },
    },
    ...overrides,
  };
}

describe("FixtureHeader — half-time score + referee (TASK-1302)", () => {
  it("renders the half-time score when present", () => {
    renderWithIntl(<FixtureHeader fixture={makeFixture()} />);
    expect(screen.getByText(/HT\s*0\s*–\s*0/)).toBeInTheDocument();
  });

  it("renders the referee when present", () => {
    renderWithIntl(<FixtureHeader fixture={makeFixture()} />);
    expect(screen.getByText(/Referee:\s*R Jones/)).toBeInTheDocument();
  });

  it("omits the half-time line when halftime is null", () => {
    const fx = makeFixture({
      score: {
        halftime: { home: null, away: null },
        fulltime: { home: 1, away: 0 },
        extratime: { home: null, away: null },
        penalty: { home: null, away: null },
      },
    });
    renderWithIntl(<FixtureHeader fixture={fx} />);
    expect(screen.queryByText(/HT/)).not.toBeInTheDocument();
  });

  it("omits the referee when referee is null", () => {
    const fx = makeFixture();
    fx.fixture.referee = null;
    renderWithIntl(<FixtureHeader fixture={fx} />);
    expect(screen.queryByText(/Referee:/)).not.toBeInTheDocument();
  });
});

describe("FixtureHeader — attendance + venue (TASK-M16)", () => {
  it("renders 'Attendance 73,297 · Old Trafford' when both present", () => {
    const fx = makeFixture();
    fx.fixture.attendance = 73297;
    fx.fixture.venue = { id: null, name: "Old Trafford", city: null };
    renderWithIntl(<FixtureHeader fixture={fx} />);
    expect(screen.getByText(/Attendance\s*73,297\s*·\s*Old Trafford/)).toBeInTheDocument();
  });

  it("renders the venue alone when attendance is null", () => {
    const fx = makeFixture();
    fx.fixture.attendance = null;
    fx.fixture.venue = { id: null, name: "Anfield", city: null };
    renderWithIntl(<FixtureHeader fixture={fx} />);
    expect(screen.getByText(/Anfield/)).toBeInTheDocument();
    expect(screen.queryByText(/Attendance/)).not.toBeInTheDocument();
  });

  it("omits the line when both attendance and venue are null", () => {
    const fx = makeFixture();
    fx.fixture.attendance = null;
    fx.fixture.venue = { id: null, name: null, city: null };
    renderWithIntl(<FixtureHeader fixture={fx} />);
    expect(screen.queryByText(/Attendance/)).not.toBeInTheDocument();
  });
});
