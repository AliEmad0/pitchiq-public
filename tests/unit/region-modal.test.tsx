import { screen } from "@testing-library/react";
import { renderWithIntl } from "./_helpers/intl";
import { describe, expect, it } from "vitest";

import type { MarkerClub } from "@/features/map/components/ClubMarker";
import { RegionModal } from "@/features/map/components/RegionModal";

const clubs: MarkerClub[] = [
  {
    teamId: 33,
    name: "Man United",
    crest: "/logos/33.png",
    color: "#DA291C",
    city: "Manchester",
    regionId: "UKD",
    region: "North West",
    x: 0,
    y: 0,
  },
  {
    teamId: 68,
    name: "Bolton",
    crest: "/logos/68.png",
    color: "#fff",
    city: "Bolton",
    regionId: "UKD",
    region: "North West",
    x: 0,
    y: 0,
  },
];

describe("RegionModal", () => {
  it("shows the region name, a title badge for champions, active/dim rows, and club links", () => {
    renderWithIntl(
      <RegionModal
        region={{ id: "UKD", name: "North West" }}
        clubs={clubs}
        titlesByClub={{ 33: 13 }}
        season={2025}
        activeSet={new Set([33])}
        latestByClub={{ 33: 2025, 68: 2012 }}
        onClose={() => {}}
      />,
    );
    expect(screen.getByRole("dialog")).toHaveTextContent("North West");
    expect(screen.getByText("13 titles")).toBeInTheDocument();
    // Active club → viewed season; dormant Bolton → its latest season (2012),
    // not the viewed 2025 which would 404 to the empty-state page.
    const link = screen.getByRole("link", { name: /Man United/ });
    expect(link).toHaveAttribute("href", "/teams/33?season=2025");
    const bolton = screen.getByRole("link", { name: /Bolton/ });
    expect(bolton).toHaveAttribute("href", "/teams/68?season=2012");
    expect(bolton).toHaveAttribute("data-active", "false");
  });

  it("renders nothing when region is null", () => {
    const { container } = renderWithIntl(
      <RegionModal
        region={null}
        clubs={[]}
        titlesByClub={{}}
        season={2025}
        activeSet={new Set()}
        latestByClub={{}}
        onClose={() => {}}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
