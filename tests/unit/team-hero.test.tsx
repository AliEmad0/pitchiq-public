import { afterEach, describe, expect, it } from "vitest";
import { cleanup, screen } from "@testing-library/react";

import { TeamHero } from "@/features/teams/components/TeamHero";
import type { Team, Venue } from "@/types/api";

import { renderWithIntl } from "./_helpers/intl";

afterEach(() => {
  cleanup();
});

function makeTeam(overrides: Partial<Team> = {}): Team {
  return {
    id: 33,
    name: "Manchester United",
    logo: "https://media.api-sports.io/football/teams/33.png",
    code: "MUN",
    country: "England",
    founded: 1878,
    national: false,
    ...overrides,
  };
}

function makeVenue(overrides: Partial<Venue> = {}): Venue {
  return {
    id: 556,
    name: "Old Trafford",
    address: "Sir Matt Busby Way",
    city: "Manchester",
    capacity: 76212,
    surface: "grass",
    image: "https://media.api-sports.io/football/venues/556.png",
    ...overrides,
  };
}

describe("TeamHero", () => {
  it("renders the team name as an h1", () => {
    renderWithIntl(<TeamHero team={makeTeam()} venue={makeVenue()} rank={1} />);
    expect(screen.getByRole("heading", { level: 1, name: "Manchester United" })).toBeTruthy();
  });

  it("renders all expected metadata fields", () => {
    renderWithIntl(<TeamHero team={makeTeam()} venue={makeVenue()} rank={1} />);
    expect(screen.getByText("Founded")).toBeTruthy();
    expect(screen.getByText("1878")).toBeTruthy();
    expect(screen.getByText("Country")).toBeTruthy();
    expect(screen.getByText("England")).toBeTruthy();
    expect(screen.getByText("Stadium")).toBeTruthy();
    expect(screen.getByText("Old Trafford")).toBeTruthy();
    expect(screen.getByText("Capacity")).toBeTruthy();
    // en-GB locale: 76,212 (with comma thousand separator).
    expect(screen.getByText("76,212")).toBeTruthy();
    expect(screen.getByText("City")).toBeTruthy();
    expect(screen.getByText("Manchester")).toBeTruthy();
  });

  it("falls back to em-dash when founded is null", () => {
    renderWithIntl(<TeamHero team={makeTeam({ founded: null })} venue={makeVenue()} rank={1} />);
    expect(screen.getByText("—")).toBeTruthy();
  });

  it("renders the rank badge with the correct ordinal suffix", () => {
    const cases: Array<[number, string]> = [
      [1, "1st in Premier League"],
      [2, "2nd in Premier League"],
      [3, "3rd in Premier League"],
      [4, "4th in Premier League"],
      [11, "11th in Premier League"],
      [12, "12th in Premier League"],
      [13, "13th in Premier League"],
      [21, "21st in Premier League"],
      [22, "22nd in Premier League"],
      [23, "23rd in Premier League"],
    ];
    for (const [rank, expected] of cases) {
      const { unmount } = renderWithIntl(
        <TeamHero team={makeTeam()} venue={makeVenue()} rank={rank} />,
      );
      expect(screen.getByText(expected)).toBeTruthy();
      unmount();
    }
  });

  it("does not render rank badge when rank is null", () => {
    renderWithIntl(<TeamHero team={makeTeam()} venue={makeVenue()} rank={null} />);
    expect(screen.queryByText(/in Premier League/)).toBeNull();
  });

  it("renders the venue image with width and height set when venue.image is non-null", () => {
    const { container } = renderWithIntl(
      <TeamHero team={makeTeam()} venue={makeVenue()} rank={1} />,
    );
    const venueImg = container.querySelector(
      `img[alt="Old Trafford stadium"]`,
    ) as HTMLImageElement | null;
    expect(venueImg).not.toBeNull();
    expect(venueImg!.getAttribute("width")).toBe("640");
    expect(venueImg!.getAttribute("height")).toBe("360");
    // `priority` suppresses lazy loading rather than emitting a positive
    // attribute in this renderer — assert the absence of the lazy hint
    // as evidence the priority path was taken.
    expect(venueImg!.getAttribute("loading")).not.toBe("lazy");
  });

  it("omits the venue image when venue.image is null", () => {
    const { container } = renderWithIntl(
      <TeamHero team={makeTeam()} venue={makeVenue({ image: null })} rank={1} />,
    );
    // The team logo (alt="") still renders. The venue image is the only
    // <img> with a non-empty alt, so querying by stadium-alt confirms its
    // absence.
    expect(container.querySelector(`img[alt$="stadium"]`)).toBeNull();
  });

  it("omits a metadata row when its underlying field is null", () => {
    renderWithIntl(
      <TeamHero
        team={makeTeam()}
        venue={makeVenue({ city: null, capacity: null, name: null })}
        rank={null}
      />,
    );
    expect(screen.queryByText("City")).toBeNull();
    expect(screen.queryByText("Capacity")).toBeNull();
    expect(screen.queryByText("Venue")).toBeNull();
    // The two always-on rows are still there.
    expect(screen.getByText("Founded")).toBeTruthy();
    expect(screen.getByText("Country")).toBeTruthy();
  });

  it("renders the team code alongside the name when present", () => {
    renderWithIntl(<TeamHero team={makeTeam()} venue={makeVenue()} rank={1} />);
    expect(screen.getByText("MUN")).toBeTruthy();
  });

  it("omits the team code when it is null", () => {
    renderWithIntl(<TeamHero team={makeTeam({ code: null })} venue={makeVenue()} rank={1} />);
    expect(screen.queryByText("MUN")).toBeNull();
  });

  it("renders the team logo with width and height set", () => {
    const { container } = renderWithIntl(
      <TeamHero team={makeTeam()} venue={makeVenue()} rank={1} />,
    );
    // The team logo has alt="" so it's a presentation role, not "img".
    // Find it via the src suffix on every <img> in the tree.
    const allImgs = Array.from(container.querySelectorAll("img"));
    const logo = allImgs.find((img) => img.src.includes("/teams/33"));
    expect(logo).toBeDefined();
    expect(logo!.getAttribute("width")).toBe("160");
    expect(logo!.getAttribute("height")).toBe("160");
  });
});
