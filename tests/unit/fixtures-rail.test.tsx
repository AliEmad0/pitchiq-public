import { afterEach, describe, expect, it } from "vitest";
import { cleanup, screen, within } from "@testing-library/react";
import { renderWithIntl } from "./_helpers/intl";

import { FixturesRail } from "@/features/leagues/components/FixturesRail";
import type { Fixture, FixtureTeam } from "@/types/api";

import fixturesOpenerFixture from "../fixtures/wire/fixtures-opener.json";

afterEach(() => {
  cleanup();
});

const liveFixtures = fixturesOpenerFixture.response as unknown as Fixture[];

type TeamOverrides = Partial<FixtureTeam>;
function team(overrides: TeamOverrides = {}): FixtureTeam {
  return {
    id: 1,
    name: "Home Club",
    logo: "https://example.test/home.png",
    winner: null,
    ...overrides,
  };
}

function makeFixture(overrides: Partial<Fixture> = {}): Fixture {
  return {
    fixture: {
      id: 1,
      referee: null,
      timezone: "UTC",
      date: "2024-08-16T19:00:00+00:00",
      timestamp: 0,
      periods: { first: null, second: null },
      venue: { id: null, name: null, city: null },
      status: { long: "Match Finished", short: "FT", elapsed: 90, extra: null },
    },
    league: {
      id: 39,
      name: "Premier League",
      country: "England",
      logo: "https://example.test/pl.png",
      flag: null,
      season: 2024,
      round: "Regular Season - 1",
      standings: true,
    },
    teams: {
      home: team({ id: 1, name: "Manchester United" }),
      away: team({ id: 2, name: "Fulham" }),
    },
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

describe("FixturesRail — happy path against live fixture", () => {
  it("renders one card per fixture", () => {
    renderWithIntl(<FixturesRail season={2024} mode="last" fixtures={liveFixtures.slice(0, 5)} />);

    const list = screen.getByRole("list", { name: /recent results/i });
    expect(within(list).getAllByRole("listitem")).toHaveLength(5);
  });

  it("uses the upcoming-fixtures aria label in `next` mode", () => {
    renderWithIntl(<FixturesRail season={2024} mode="next" fixtures={liveFixtures.slice(0, 3)} />);
    expect(screen.getByRole("list", { name: /upcoming fixtures/i })).toBeInTheDocument();
  });

  it("renders both home and away team names in every card", () => {
    renderWithIntl(<FixturesRail season={2024} mode="last" fixtures={liveFixtures.slice(0, 2)} />);

    // First card: Manchester United vs Fulham
    expect(screen.getByText("Manchester United")).toBeInTheDocument();
    expect(screen.getByText("Fulham")).toBeInTheDocument();
    // Second card: Ipswich vs Liverpool
    expect(screen.getByText("Ipswich")).toBeInTheDocument();
    expect(screen.getByText("Liverpool")).toBeInTheDocument();
  });

  it("renders crest logos with object-contain so non-square crests aren't stretched (TASK-M37)", () => {
    renderWithIntl(<FixturesRail season={2024} mode="last" fixtures={[makeFixture()]} />);

    const logos = document.querySelectorAll("img");
    expect(logos.length).toBeGreaterThan(0);
    for (const img of logos) {
      expect(img.className).toMatch(/object-contain/);
    }
  });
});

describe("FixturesRail — scoreline behavior", () => {
  it("shows 'vs' (not the score) when mode is `next`", () => {
    renderWithIntl(
      <FixturesRail
        season={2024}
        mode="next"
        fixtures={[
          makeFixture({
            goals: { home: null, away: null },
            teams: {
              home: team({ id: 1, name: "A" }),
              away: team({ id: 2, name: "B" }),
            },
          }),
        ]}
      />,
    );

    expect(screen.getByText(/^vs$/i)).toBeInTheDocument();
  });

  it("shows the final score and labels it for screen readers when mode is `last`", () => {
    renderWithIntl(
      <FixturesRail
        season={2024}
        mode="last"
        fixtures={[
          makeFixture({
            goals: { home: 3, away: 1 },
            teams: {
              home: team({ id: 1, name: "A", winner: true }),
              away: team({ id: 2, name: "B", winner: false }),
            },
          }),
        ]}
      />,
    );

    expect(screen.getByText("3–1")).toBeInTheDocument();
    expect(screen.getByLabelText(/3-1 final score/i)).toBeInTheDocument();
  });

  it("falls back to em-dashes when goals are null in `last` mode", () => {
    renderWithIntl(
      <FixturesRail
        season={2024}
        mode="last"
        fixtures={[makeFixture({ goals: { home: null, away: null } })]}
      />,
    );

    expect(screen.getByText("—–—")).toBeInTheDocument();
  });
});

describe("FixturesRail — losing-side dimming", () => {
  it("dims the loser in `last` mode (home loses)", () => {
    renderWithIntl(
      <FixturesRail
        season={2024}
        mode="last"
        fixtures={[
          makeFixture({
            goals: { home: 0, away: 2 },
            teams: {
              home: team({ id: 1, name: "Loser", winner: false }),
              away: team({ id: 2, name: "Winner", winner: true }),
            },
          }),
        ]}
      />,
    );

    expect(screen.getByText("Loser").className).toMatch(/text-muted-foreground/);
    expect(screen.getByText("Winner").className).not.toMatch(/text-muted-foreground/);
  });

  it("dims the away loser in `last` mode (away loses)", () => {
    renderWithIntl(
      <FixturesRail
        season={2024}
        mode="last"
        fixtures={[
          makeFixture({
            goals: { home: 2, away: 0 },
            teams: {
              home: team({ id: 1, name: "Winner", winner: true }),
              away: team({ id: 2, name: "Loser", winner: false }),
            },
          }),
        ]}
      />,
    );

    expect(screen.getByText("Loser").className).toMatch(/text-muted-foreground/);
  });

  it("does NOT dim either side on a draw (winner === null for both)", () => {
    renderWithIntl(
      <FixturesRail
        season={2024}
        mode="last"
        fixtures={[
          makeFixture({
            goals: { home: 1, away: 1 },
            teams: {
              home: team({ id: 1, name: "DrawHome", winner: null }),
              away: team({ id: 2, name: "DrawAway", winner: null }),
            },
          }),
        ]}
      />,
    );

    expect(screen.getByText("DrawHome").className).not.toMatch(/text-muted-foreground/);
    expect(screen.getByText("DrawAway").className).not.toMatch(/text-muted-foreground/);
  });

  it("does NOT dim in `next` mode regardless of winner field", () => {
    renderWithIntl(
      <FixturesRail
        season={2024}
        mode="next"
        fixtures={[
          makeFixture({
            teams: {
              home: team({ id: 1, name: "Home", winner: false }),
              away: team({ id: 2, name: "Away", winner: true }),
            },
          }),
        ]}
      />,
    );

    expect(screen.getByText("Home").className).not.toMatch(/text-muted-foreground/);
    expect(screen.getByText("Away").className).not.toMatch(/text-muted-foreground/);
  });
});

describe("FixturesRail — kickoff formatting", () => {
  it("formats kickoff as 'Day, D Mon · HH:MM' in Europe/London", () => {
    renderWithIntl(
      <FixturesRail
        season={2024}
        mode="last"
        fixtures={[
          makeFixture({
            fixture: {
              ...makeFixture().fixture,
              // 2024-08-16T19:00:00+00:00 == 2024-08-16T20:00 in London (BST)
              date: "2024-08-16T19:00:00+00:00",
            },
          }),
        ]}
      />,
    );

    expect(screen.getByText(/Fri, 16 Aug · 20:00/)).toBeInTheDocument();
  });

  it("surfaces the ISO date on the <time> element for machine consumption", () => {
    const iso = "2024-08-16T19:00:00+00:00";
    renderWithIntl(
      <FixturesRail
        season={2024}
        mode="last"
        fixtures={[
          makeFixture({
            fixture: { ...makeFixture().fixture, date: iso },
          }),
        ]}
      />,
    );

    // happy-dom exposes the <time> tag as an HTMLElement with `dateTime`.
    const time = document.querySelector("time");
    expect(time).not.toBeNull();
    expect(time?.getAttribute("datetime")).toBe(iso);
  });
});

describe("FixturesRail — empty state", () => {
  it("renders a polite empty-state status when fixtures is empty (next mode)", () => {
    renderWithIntl(<FixturesRail season={2024} mode="next" fixtures={[]} />);

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent(/no upcoming fixtures/i);
  });

  it("renders a polite empty-state status when fixtures is empty (last mode)", () => {
    renderWithIntl(<FixturesRail season={2024} mode="last" fixtures={[]} />);

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent(/no recent results/i);
  });

  it("does not render a list when fixtures is empty", () => {
    renderWithIntl(<FixturesRail season={2024} mode="next" fixtures={[]} />);
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });
});

describe("FixturesRail (TASK-606 link structure)", () => {
  it("links each card to /fixtures/{id} via a match-details link", () => {
    const fixtures = [
      makeFixture({
        fixture: { ...makeFixture().fixture, id: 100 },
        teams: { home: team({ id: 1, name: "Home A" }), away: team({ id: 2, name: "Away A" }) },
      }),
      makeFixture({
        fixture: { ...makeFixture().fixture, id: 200 },
        teams: { home: team({ id: 3, name: "Home B" }), away: team({ id: 4, name: "Away B" }) },
      }),
    ];
    renderWithIntl(<FixturesRail season={2024} mode="next" fixtures={fixtures} />);

    expect(
      screen.getByRole("link", { name: /match details: home a versus away a/i }),
    ).toHaveAttribute("href", "/fixtures/100");
    expect(
      screen.getByRole("link", { name: /match details: home b versus away b/i }),
    ).toHaveAttribute("href", "/fixtures/200");
  });

  it("links each team name/logo to its /teams/{id} page (sibling of the fixture link)", () => {
    const fixture = makeFixture({
      fixture: { ...makeFixture().fixture, id: 300 },
      teams: {
        home: team({ id: 40, name: "Liverpool" }),
        away: team({ id: 42, name: "Arsenal" }),
      },
    });
    renderWithIntl(<FixturesRail season={2024} mode="last" fixtures={[fixture]} />);

    expect(screen.getByRole("link", { name: /view liverpool page/i })).toHaveAttribute(
      "href",
      "/teams/40?season=2024",
    );
    expect(screen.getByRole("link", { name: /view arsenal page/i })).toHaveAttribute(
      "href",
      "/teams/42?season=2024",
    );
    // The team links are NOT nested inside the fixture link (no nested <a>).
    const fixtureLink = screen.getByRole("link", { name: /match details/i });
    expect(fixtureLink.querySelector("a")).toBeNull();
  });
});
