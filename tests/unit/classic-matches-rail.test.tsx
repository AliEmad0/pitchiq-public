import { afterEach, describe, expect, it } from "vitest";
import { cleanup, screen, within } from "@testing-library/react";
import { renderWithIntl } from "./_helpers/intl";

import { ClassicMatchesRail } from "@/features/leagues/components/ClassicMatchesRail";
import type { ClassicMatchView } from "@/features/leagues/classic-matches.api";
import type { Fixture } from "@/types/api";

afterEach(() => {
  cleanup();
});

function view(
  id: string,
  home: string,
  away: string,
  badge: ClassicMatchView["badge"],
): ClassicMatchView {
  const fixture = {
    fixture: {
      id,
      referee: null,
      timezone: "UTC",
      date: "2024-08-16T19:00:00+00:00",
      timestamp: 0,
    },
    teams: {
      home: { id: 1, name: home, logo: "/logos/1.png", winner: true },
      away: { id: 2, name: away, logo: "/logos/2.png", winner: false },
    },
    goals: { home: 4, away: 3 },
  } as unknown as Fixture;
  return { fixture, badge };
}

describe("ClassicMatchesRail", () => {
  it("renders one card per match, resolving each badge key to its label", () => {
    renderWithIntl(
      <ClassicMatchesRail
        season={2024}
        matches={[
          view("a", "Arsenal", "Spurs", { key: "goalThriller", total: 7 }),
          view("b", "Liverpool", "City", { key: "badgeTitleDecider" }),
        ]}
      />,
    );

    const list = screen.getByRole("list", { name: /classic matches/i });
    expect(within(list).getAllByRole("listitem")).toHaveLength(2);
    // The rail resolves the message key → localized (en) label via next-intl.
    expect(screen.getByText("7-goal thriller")).toBeInTheDocument();
    expect(screen.getByText("Title-Race Decider")).toBeInTheDocument();
  });

  it("renders a polite empty state when there are no matches", () => {
    renderWithIntl(<ClassicMatchesRail season={2024} matches={[]} />);
    expect(screen.getByRole("status")).toHaveTextContent(/no classic matches/i);
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });
});
