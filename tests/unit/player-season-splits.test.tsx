import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { PlayerSeasonSplits } from "@/features/players/components/PlayerSeasonSplits";
import type { PlayerSeasonSplit } from "@/data/schemas";

import { renderWithIntl } from "./_helpers/intl";

afterEach(cleanup);

const splits: PlayerSeasonSplit[] = [
  {
    teamId: 45,
    teamName: "Everton",
    appearances: 20,
    goals: 6,
    assists: 3,
    yellowCards: 1,
    redCards: 0,
  },
  {
    teamId: 44,
    teamName: "Burnley",
    appearances: 14,
    goals: 4,
    assists: 1,
    yellowCards: 2,
    redCards: 0,
  },
];

describe("PlayerSeasonSplits", () => {
  it("renders a row per club with its stats", () => {
    renderWithIntl(<PlayerSeasonSplits splits={splits} season={2024} />);
    expect(screen.getByText("Everton")).toBeInTheDocument();
    expect(screen.getByText("Burnley")).toBeInTheDocument();
    // Everton's appearances + goals.
    expect(screen.getByText("20")).toBeInTheDocument();
    expect(screen.getByText("6")).toBeInTheDocument();
  });

  it("renders each club's crest", () => {
    renderWithIntl(<PlayerSeasonSplits splits={splits} season={2024} />);
    const evertonCrest = screen.getByAltText("Everton");
    expect(evertonCrest).toBeInTheDocument();
  });

  it("links each club to its team page for the viewed season", () => {
    renderWithIntl(<PlayerSeasonSplits splits={splits} season={2024} />);
    const link = screen.getByRole("link", { name: /Everton/ });
    expect(link).toHaveAttribute("href", "/teams/45?season=2024");
  });

  it("renders nothing for an empty/absent split list", () => {
    const { container } = renderWithIntl(<PlayerSeasonSplits splits={[]} season={2024} />);
    expect(container).toBeEmptyDOMElement();
  });
});
