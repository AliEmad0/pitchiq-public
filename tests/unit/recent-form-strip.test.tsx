import { afterEach, describe, expect, it } from "vitest";
import { cleanup, screen, within } from "@testing-library/react";

import {
  RecentFormStrip,
  RecentFormStripSkeleton,
  deriveFormItems,
} from "@/features/teams/components/RecentFormStrip";
import type { Fixture } from "@/types/api";

import { renderWithIntl } from "./_helpers/intl";

afterEach(() => {
  cleanup();
});

const TEAM_ID = 33;
const OPP = (id: number, name: string) => ({
  id,
  name,
  logo: `https://media.example.test/football/teams/${id}.png`,
});

function fx({
  id,
  date,
  homeId,
  awayId,
  homeName,
  awayName,
  homeGoals,
  awayGoals,
  homeWinner,
  awayWinner,
}: {
  id: number;
  date: string;
  homeId: number;
  awayId: number;
  homeName: string;
  awayName: string;
  homeGoals: number | null;
  awayGoals: number | null;
  homeWinner: boolean | null;
  awayWinner: boolean | null;
}): Fixture {
  return {
    fixture: {
      id,
      referee: null,
      timezone: "UTC",
      date,
      timestamp: Math.floor(new Date(date).getTime() / 1000),
      periods: { first: null, second: null },
      venue: { id: null, name: null, city: null },
      status: { long: "Match Finished", short: "FT", elapsed: 90, extra: null },
    },
    league: {
      id: 39,
      name: "Premier League",
      country: "England",
      logo: "x",
      flag: null,
      season: 2024,
      round: "Regular Season - 1",
      standings: true,
    },
    teams: {
      home: { ...OPP(homeId, homeName), winner: homeWinner },
      away: { ...OPP(awayId, awayName), winner: awayWinner },
    },
    goals: { home: homeGoals, away: awayGoals },
    score: {
      halftime: { home: null, away: null },
      fulltime: { home: homeGoals, away: awayGoals },
      extratime: { home: null, away: null },
      penalty: { home: null, away: null },
    },
  };
}

// 5 fixtures, NEWEST-first as getTeamRecentFixtures returns them.
// (Oldest is index 4: the 2025-04-27 match.)
const baseFixtures: Fixture[] = [
  // Newest: away win at City
  fx({
    id: 5,
    date: "2025-05-25T15:00:00+00:00",
    homeId: 50,
    awayId: TEAM_ID,
    homeName: "Manchester City",
    awayName: "Manchester United",
    homeGoals: 1,
    awayGoals: 3,
    homeWinner: false,
    awayWinner: true,
  }),
  // Home draw vs Arsenal
  fx({
    id: 4,
    date: "2025-05-18T15:00:00+00:00",
    homeId: TEAM_ID,
    awayId: 42,
    homeName: "Manchester United",
    awayName: "Arsenal",
    homeGoals: 2,
    awayGoals: 2,
    homeWinner: null,
    awayWinner: null,
  }),
  // Home loss to Liverpool
  fx({
    id: 3,
    date: "2025-05-11T15:00:00+00:00",
    homeId: TEAM_ID,
    awayId: 40,
    homeName: "Manchester United",
    awayName: "Liverpool",
    homeGoals: 0,
    awayGoals: 1,
    homeWinner: false,
    awayWinner: true,
  }),
  // Away loss at Chelsea
  fx({
    id: 2,
    date: "2025-05-04T15:00:00+00:00",
    homeId: 49,
    awayId: TEAM_ID,
    homeName: "Chelsea",
    awayName: "Manchester United",
    homeGoals: 4,
    awayGoals: 0,
    homeWinner: true,
    awayWinner: false,
  }),
  // Oldest: home win vs Spurs
  fx({
    id: 1,
    date: "2025-04-27T15:00:00+00:00",
    homeId: TEAM_ID,
    awayId: 47,
    homeName: "Manchester United",
    awayName: "Tottenham",
    homeGoals: 2,
    awayGoals: 1,
    homeWinner: true,
    awayWinner: false,
  }),
];

describe("deriveFormItems", () => {
  it("reverses input to oldest-first so the strip can render left-to-right by date", () => {
    const items = deriveFormItems(baseFixtures, TEAM_ID);
    expect(items.map((i) => i.fixtureId)).toEqual([1, 2, 3, 4, 5]);
  });

  it("computes W when our team's winner is true", () => {
    const items = deriveFormItems(baseFixtures, TEAM_ID);
    // Oldest (id=1, home win vs Spurs)
    expect(items[0].result).toBe("W");
    // Newest (id=5, away win at City)
    expect(items[4].result).toBe("W");
  });

  it("computes L when our team's winner is false", () => {
    const items = deriveFormItems(baseFixtures, TEAM_ID);
    // id=2: Chelsea won at home; we (away) lost
    expect(items[1].result).toBe("L");
    // id=3: Liverpool won away; we (home) lost
    expect(items[2].result).toBe("L");
  });

  it("computes D when our team's winner is null", () => {
    const items = deriveFormItems(baseFixtures, TEAM_ID);
    // id=4: home draw vs Arsenal
    expect(items[3].result).toBe("D");
  });

  it("formats score with our goals first regardless of home/away", () => {
    const items = deriveFormItems(baseFixtures, TEAM_ID);
    expect(items[0].scoreLine).toBe("2–1"); // home, won 2-1
    expect(items[1].scoreLine).toBe("0–4"); // away, lost 0-4
    expect(items[4].scoreLine).toBe("3–1"); // away at City, won 3-1 (us 3, them 1)
  });

  it("identifies home vs away correctly", () => {
    const items = deriveFormItems(baseFixtures, TEAM_ID);
    expect(items[0].isHome).toBe(true); // vs Spurs
    expect(items[1].isHome).toBe(false); // at Chelsea
    expect(items[4].isHome).toBe(false); // at City
  });

  it("identifies the opponent correctly", () => {
    const items = deriveFormItems(baseFixtures, TEAM_ID);
    expect(items[0].opponent.name).toBe("Tottenham");
    expect(items[4].opponent.name).toBe("Manchester City");
  });

  it("treats null goals as zeros for score formatting", () => {
    const partial: Fixture[] = [
      fx({
        id: 1,
        date: "2025-04-27T15:00:00+00:00",
        homeId: TEAM_ID,
        awayId: 47,
        homeName: "Manchester United",
        awayName: "Tottenham",
        homeGoals: null,
        awayGoals: null,
        homeWinner: null,
        awayWinner: null,
      }),
    ];
    const items = deriveFormItems(partial, TEAM_ID);
    expect(items[0].scoreLine).toBe("0–0");
  });
});

describe("RecentFormStrip", () => {
  it("renders the empty-state copy when fixtures is empty", () => {
    renderWithIntl(<RecentFormStrip fixtures={[]} teamId={TEAM_ID} />);
    expect(screen.getByText("No recent fixtures available")).toBeTruthy();
  });

  it("renders 5 big-score result cards (TASK-1506)", () => {
    const { container } = renderWithIntl(
      <RecentFormStrip fixtures={baseFixtures} teamId={TEAM_ID} />,
    );
    const list = container.querySelector("[aria-label='Recent results']");
    expect(list).not.toBeNull();
    expect(list!.children.length).toBe(5);
    expect(container.querySelectorAll("li").length).toBe(5);
  });

  it("orders cards oldest-first — first card corresponds to the oldest fixture", () => {
    renderWithIntl(<RecentFormStrip fixtures={baseFixtures} teamId={TEAM_ID} />);
    const rows = screen.getAllByRole("listitem");
    // First row is the oldest match (vs Tottenham 2–1)
    expect(within(rows[0]).getByText("Tottenham")).toBeTruthy();
    expect(within(rows[0]).getByText("2–1")).toBeTruthy();
    // Last row is the newest (at Manchester City 3–1)
    expect(within(rows[4]).getByText("Manchester City")).toBeTruthy();
    expect(within(rows[4]).getByText("3–1")).toBeTruthy();
  });

  it("annotates each card link with an accessible name including result + opponent + score", () => {
    renderWithIntl(<RecentFormStrip fixtures={baseFixtures} teamId={TEAM_ID} />);
    const links = screen.getAllByRole("link");
    expect(links[0].getAttribute("aria-label")).toContain("Win");
    expect(links[0].getAttribute("aria-label")).toContain("Tottenham");
    expect(links[0].getAttribute("aria-label")).toContain("2–1");
  });

  it("shows `@` prefix for away rows and `vs` for home rows", () => {
    renderWithIntl(<RecentFormStrip fixtures={baseFixtures} teamId={TEAM_ID} />);
    const rows = screen.getAllByRole("listitem");
    // Oldest (vs Tottenham — home)
    expect(within(rows[0]).getByText("vs")).toBeTruthy();
    // Newest (at Manchester City — away)
    expect(within(rows[4]).getByText("@")).toBeTruthy();
  });

  it("links each row to its fixture page (TASK-M46)", () => {
    renderWithIntl(<RecentFormStrip fixtures={baseFixtures} teamId={TEAM_ID} />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(5);
    // Oldest row → fixture id 1; newest → id 5 (the detail route derives season).
    expect(links[0].getAttribute("href")).toBe("/fixtures/1");
    expect(links[4].getAttribute("href")).toBe("/fixtures/5");
  });
});

describe("RecentFormStripSkeleton", () => {
  it("renders a status region with 5 strip placeholders + 5 row placeholders", () => {
    const { container } = renderWithIntl(<RecentFormStripSkeleton />);
    expect(container.querySelector("[role='status']")).not.toBeNull();
    expect(container.querySelectorAll("li").length).toBe(5);
  });
});
