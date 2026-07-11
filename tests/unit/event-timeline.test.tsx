import { screen } from "@testing-library/react";
import { renderWithIntl } from "./_helpers/intl";
import { describe, expect, it } from "vitest";

import { EventTimeline } from "@/features/leagues/components/EventTimeline";
import type { FixtureEvent } from "@/types/api";

const HOME = { id: 1, name: "Home", logo: "x" };
const AWAY = { id: 2, name: "Away", logo: "x" };

const ev = (overrides: Partial<FixtureEvent>): FixtureEvent => ({
  time: { elapsed: 10, extra: null },
  team: HOME,
  player: { id: 1, name: "P" },
  assist: { id: null, name: null },
  type: "Goal",
  detail: "Normal Goal",
  comments: null,
  ...overrides,
});

describe("EventTimeline", () => {
  it("renders an empty-state when there are no events", () => {
    renderWithIntl(<EventTimeline events={[]} homeId={HOME.id} />);
    expect(screen.getByRole("status", { name: /no events/i })).toBeInTheDocument();
  });

  it("renders events in the given order with correct minute formatting (including extra time)", () => {
    const events: FixtureEvent[] = [
      ev({ time: { elapsed: 23, extra: null }, player: { id: 1, name: "Alpha" } }),
      ev({ time: { elapsed: 45, extra: 2 }, player: { id: 2, name: "Beta" } }),
      ev({ time: { elapsed: 67, extra: null }, player: { id: 3, name: "Gamma" } }),
    ];
    renderWithIntl(<EventTimeline events={events} homeId={HOME.id} />);

    const minutes = screen.getAllByTestId("event-minute").map((el) => el.textContent);
    expect(minutes).toEqual(["23'", "45+2'", "67'"]);
  });

  it("uses distinct aria-labels for goal, yellow, red, subst, VAR", () => {
    const events: FixtureEvent[] = [
      ev({ type: "Goal", detail: "Normal Goal" }),
      ev({ type: "Card", detail: "Yellow Card", player: { id: 2, name: "Yellow" } }),
      ev({ type: "Card", detail: "Red Card", player: { id: 3, name: "Red" } }),
      ev({ type: "subst", detail: "Substitution 1", player: { id: 4, name: "Sub" } }),
      ev({ type: "Var", detail: "Goal cancelled", player: { id: 5, name: "Var" } }),
    ];
    renderWithIntl(<EventTimeline events={events} homeId={HOME.id} />);

    expect(screen.getByLabelText(/^goal$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^yellow card$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^red card$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^substitution$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^var$/i)).toBeInTheDocument();
  });

  it("links a resolved event player to its profile (M21)", () => {
    renderWithIntl(
      <EventTimeline
        events={[ev({ player: { id: 1000208, name: "Bruno Fernandes" } })]}
        homeId={HOME.id}
        season={2024}
      />,
    );
    expect(screen.getByRole("link", { name: "Bruno Fernandes" })).toHaveAttribute(
      "href",
      "/players/1000208?season=2024",
    );
  });

  it("leaves an unresolved event player (id null) as plain text (M21)", () => {
    renderWithIntl(
      <EventTimeline
        events={[ev({ player: { id: null, name: "Unknown Sub" } })]}
        homeId={HOME.id}
        season={2024}
      />,
    );
    expect(screen.queryByRole("link", { name: "Unknown Sub" })).not.toBeInTheDocument();
    expect(screen.getByText("Unknown Sub")).toBeInTheDocument();
  });

  it("places home events on the left and away events on the right (centre timeline)", () => {
    const events: FixtureEvent[] = [
      ev({ team: HOME, player: { id: 1, name: "HomePlayer" } }),
      ev({ team: AWAY, player: { id: 2, name: "AwayPlayer" } }),
    ];
    renderWithIntl(<EventTimeline events={events} homeId={HOME.id} />);

    const rows = screen.getAllByRole("listitem");
    expect(rows[0]).toHaveAttribute("data-side", "home");
    expect(rows[1]).toHaveAttribute("data-side", "away");
    // Home content sits in the left grid cell, away content in the right cell.
    expect(rows[0].firstElementChild).toHaveTextContent("HomePlayer");
    expect(rows[1].lastElementChild).toHaveTextContent("AwayPlayer");
  });
});
