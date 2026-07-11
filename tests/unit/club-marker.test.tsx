import { screen } from "@testing-library/react";
import { renderWithIntl } from "./_helpers/intl";
import { describe, expect, it } from "vitest";

import { ClubMarker } from "@/features/map/components/ClubMarker";

const club = {
  teamId: 42,
  name: "Arsenal",
  crest: "/logos/42.png",
  color: "#C8102E",
  city: "London",
  regionId: "UKI",
  region: "London",
  x: 78,
  y: 86,
};

describe("ClubMarker", () => {
  it("active marker links to the team page with the season and is marked active", () => {
    renderWithIntl(<ClubMarker club={club} active season={2025} linkSeason={2025} />);
    const link = screen.getByRole("link", { name: /Arsenal/ });
    expect(link).toHaveAttribute("href", "/teams/42?season=2025");
    expect(link).toHaveAttribute("data-active", "true");
  });

  it("absent marker links to its latest season (not the viewed one) and is marked inactive", () => {
    // Viewing 1996 but the club's most recent season is 2010 → the link should
    // carry 2010 so it lands on a page with data, not the empty-state page.
    renderWithIntl(<ClubMarker club={club} active={false} season={1996} linkSeason={2010} />);
    const link = screen.getByRole("link", { name: /Arsenal/ });
    expect(link).toHaveAttribute("href", "/teams/42?season=2010");
    expect(link).toHaveAttribute("data-active", "false");
    expect(link.getAttribute("aria-label")).toContain("not in the top flight");
  });
});
