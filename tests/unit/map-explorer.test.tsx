import { screen } from "@testing-library/react";
import { renderWithIntl } from "./_helpers/intl";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { describe, expect, it } from "vitest";

import type { MarkerClub } from "@/features/map/components/ClubMarker";
import { MapExplorer } from "@/features/map/components/MapExplorer";

const clubs: MarkerClub[] = [
  {
    teamId: 42,
    name: "Arsenal",
    crest: "/logos/42.png",
    color: "#C8102E",
    city: "London",
    regionId: "UKI",
    region: "London",
    x: 78,
    y: 86,
  },
  {
    teamId: 67,
    name: "Blackburn",
    crest: "/logos/67.png",
    color: "#009EE0",
    city: "Blackburn",
    regionId: "UKD",
    region: "North West",
    x: 44,
    y: 58,
  },
];
const activeBySeason = { 2025: [42], 1996: [42, 67] };

describe("MapExplorer", () => {
  it("renders every club as a marker, glowing the active ones for the season", () => {
    renderWithIntl(
      <NuqsTestingAdapter searchParams="?season=2025">
        <MapExplorer
          clubs={clubs}
          activeBySeason={activeBySeason}
          seasons={[1996, 2025]}
          titlesByClub={{}}
        />
      </NuqsTestingAdapter>,
    );
    expect(screen.getByRole("link", { name: /Arsenal/ })).toHaveAttribute("data-active", "true");
    expect(screen.getByRole("link", { name: /Blackburn/ })).toHaveAttribute("data-active", "false");
    expect(screen.getByText(/1 of 51/)).toBeInTheDocument();
  });
});
