import { afterEach, describe, expect, it } from "vitest";
import { cleanup, screen, within } from "@testing-library/react";

import {
  StatLeaderboard,
  type StatLeaderboardEntry,
} from "@/features/players/components/StatLeaderboard";

import { renderWithIntl } from "./_helpers/intl";

afterEach(() => {
  cleanup();
});

function makeEntries(count: number): StatLeaderboardEntry[] {
  return Array.from({ length: count }, (_, i) => ({
    rank: i + 1,
    name: `Player ${i + 1}`,
    team: `Team ${i + 1}`,
    photo: `https://example.test/photo-${i + 1}.png`,
    value: 30 - i,
  }));
}

describe("StatLeaderboard — happy path", () => {
  it("renders the title and value label in the header", () => {
    renderWithIntl(
      <StatLeaderboard title="Top Scorers" valueLabel="Goals" entries={makeEntries(3)} />,
    );

    expect(screen.getByText("Top Scorers")).toBeInTheDocument();
    expect(screen.getByText("Goals")).toBeInTheDocument();
  });

  it("renders one <li> per entry up to the top-5 cap", () => {
    renderWithIntl(
      <StatLeaderboard title="Top Scorers" valueLabel="Goals" entries={makeEntries(3)} />,
    );

    const list = screen.getByRole("list", { name: "Top Scorers" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(3);
  });

  it("slices entries to the top 5 when more are passed", () => {
    renderWithIntl(
      <StatLeaderboard title="Top Scorers" valueLabel="Goals" entries={makeEntries(10)} />,
    );

    const list = screen.getByRole("list", { name: "Top Scorers" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(5);
  });

  it("renders each entry's rank, name, team, and value", () => {
    renderWithIntl(
      <StatLeaderboard
        title="Top Scorers"
        valueLabel="Goals"
        entries={[
          {
            rank: 1,
            name: "Mohamed Salah",
            team: "Liverpool",
            photo: "https://example.test/salah.png",
            value: 29,
          },
        ]}
      />,
    );

    const list = screen.getByRole("list", { name: "Top Scorers" });
    const item = within(list).getByRole("listitem");
    expect(within(item).getByText("1")).toBeInTheDocument();
    expect(within(item).getByText("Mohamed Salah")).toBeInTheDocument();
    expect(within(item).getByText("Liverpool")).toBeInTheDocument();
    expect(within(item).getByLabelText("29 Goals")).toBeInTheDocument();
  });
});

describe("StatLeaderboard — empty state", () => {
  it("renders a polite 'No data available' status when entries is empty", () => {
    renderWithIntl(<StatLeaderboard title="Top Scorers" valueLabel="Goals" entries={[]} />);

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent(/no data available/i);
    expect(status).toHaveAttribute("aria-live", "polite");
  });

  it("does not render an ordered list when entries is empty", () => {
    renderWithIntl(<StatLeaderboard title="Top Scorers" valueLabel="Goals" entries={[]} />);

    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });
});

describe("StatLeaderboard — accent prop", () => {
  it("applies the amber accent class on the value cell", () => {
    renderWithIntl(
      <StatLeaderboard
        title="Top Scorers"
        valueLabel="Goals"
        entries={[
          {
            rank: 1,
            name: "Player",
            team: "Team",
            photo: "x.png",
            value: 29,
          },
        ]}
        accent="amber"
      />,
    );

    const value = screen.getByLabelText("29 Goals");
    expect(value.className).toMatch(/text-amber-600/);
  });

  it.each([
    ["blue", /text-blue-600/],
    ["yellow", /text-yellow-600/],
    ["red", /text-red-600/],
  ] as const)("applies the %s accent class", (accent, regex) => {
    renderWithIntl(
      <StatLeaderboard
        title="x"
        valueLabel="y"
        entries={[{ rank: 1, name: "P", team: "T", photo: "x.png", value: 1 }]}
        accent={accent}
      />,
    );

    const value = screen.getByLabelText("1 y");
    expect(value.className).toMatch(regex);
  });

  it("omits accent classes when no accent prop is provided", () => {
    renderWithIntl(
      <StatLeaderboard
        title="x"
        valueLabel="y"
        entries={[{ rank: 1, name: "P", team: "T", photo: "x.png", value: 1 }]}
      />,
    );

    const value = screen.getByLabelText("1 y");
    expect(value.className).not.toMatch(/text-(amber|blue|yellow|red)-600/);
  });
});

describe("StatLeaderboard — avatar (via <PlayerImage>)", () => {
  it("renders a PL CDN <img> when the entry photo is an FPL asset code", () => {
    const { container } = renderWithIntl(
      <StatLeaderboard
        title="Top Scorers"
        valueLabel="Goals"
        entries={[
          { rank: 1, name: "Mohamed Salah", team: "Liverpool", photo: "118748", value: 29 },
        ]}
      />,
    );
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img!.getAttribute("src")).toContain("/110x140/118748.png");
  });

  it("renders an initials monogram (no <img>) when the entry has no photo", () => {
    const { container } = renderWithIntl(
      <StatLeaderboard
        title="Top Scorers"
        valueLabel="Goals"
        entries={[{ rank: 1, name: "Mohamed Salah", team: "Liverpool", photo: "", value: 29 }]}
      />,
    );
    expect(container.querySelector("img")).toBeNull();
    const list = screen.getByRole("list", { name: "Top Scorers" });
    expect(within(list).getByText("MS")).toBeInTheDocument();
  });
});

describe("StatLeaderboard — team link (TASK-606)", () => {
  it("links the team label to /teams/{teamId} when teamId is present", () => {
    renderWithIntl(
      <StatLeaderboard
        title="Top Scorers"
        valueLabel="Goals"
        entries={[
          {
            rank: 1,
            name: "Mohamed Salah",
            team: "Liverpool",
            teamId: 40,
            photo: "118748",
            value: 29,
          },
        ]}
      />,
    );
    expect(screen.getByRole("link", { name: /view liverpool page/i })).toHaveAttribute(
      "href",
      "/teams/40",
    );
  });

  it("renders the team as plain text when teamId is absent", () => {
    renderWithIntl(
      <StatLeaderboard
        title="Top Scorers"
        valueLabel="Goals"
        entries={[{ rank: 1, name: "Player", team: "Solo FC", photo: "", value: 1 }]}
      />,
    );
    expect(screen.queryByRole("link", { name: /solo fc/i })).toBeNull();
    expect(screen.getByText("Solo FC")).toBeInTheDocument();
  });
});

describe("StatLeaderboard — player link (player-link sweep)", () => {
  it("links the player name to /players/{playerId} when present", () => {
    renderWithIntl(
      <StatLeaderboard
        title="Top Scorers"
        valueLabel="Goals"
        entries={[
          {
            rank: 1,
            name: "Mohamed Salah",
            playerId: 1000334,
            team: "Liverpool",
            teamId: 40,
            photo: "118748",
            value: 29,
          },
        ]}
      />,
    );
    // The team link carries an aria-label ("View Liverpool page"), so the
    // name link is the only one whose accessible name is exactly the player.
    expect(screen.getByRole("link", { name: "Mohamed Salah" })).toHaveAttribute(
      "href",
      "/players/1000334",
    );
  });

  it("renders the player name as text when playerId is absent", () => {
    renderWithIntl(
      <StatLeaderboard
        title="Top Scorers"
        valueLabel="Goals"
        entries={[{ rank: 1, name: "Mystery", team: "FC", photo: "", value: 1 }]}
      />,
    );
    expect(screen.queryByRole("link", { name: "Mystery" })).toBeNull();
    expect(screen.getByText("Mystery")).toBeInTheDocument();
  });
});

describe("StatLeaderboard — header (Phase 15 redesign)", () => {
  it("renders the title as an h2 heading", () => {
    renderWithIntl(
      <StatLeaderboard title="Top Scorers" valueLabel="Goals" entries={makeEntries(1)} />,
    );
    // Substring match — the h2's accessible name is "Top Scorers Goals".
    expect(screen.getByRole("heading", { level: 2, name: /Top Scorers/ })).toBeInTheDocument();
  });

  it("renders a 'See all' link when seeAllHref is provided", () => {
    renderWithIntl(
      <StatLeaderboard
        title="Top Scorers"
        valueLabel="Goals"
        entries={makeEntries(1)}
        seeAllHref="/leaderboards?season=2025"
      />,
    );
    expect(screen.getByRole("link", { name: /see all/i })).toHaveAttribute(
      "href",
      "/leaderboards?season=2025",
    );
  });

  it("omits the 'See all' link when seeAllHref is absent", () => {
    renderWithIntl(
      <StatLeaderboard title="Top Scorers" valueLabel="Goals" entries={makeEntries(1)} />,
    );
    expect(screen.queryByRole("link", { name: /see all/i })).toBeNull();
  });
});

describe("StatLeaderboard — badge variant (TASK-1513)", () => {
  it("keeps the h2 heading, medal-disc rank, links, and accented value", () => {
    renderWithIntl(
      <StatLeaderboard
        title="Goals"
        valueLabel="Goals"
        accent="amber"
        variant="badge"
        entries={[
          {
            rank: 1,
            name: "Erling Haaland",
            playerId: 1,
            team: "Man City",
            teamId: 50,
            photo: "118748",
            value: 27,
          },
        ]}
      />,
    );
    // Title still a navigable h2 (now in an accent pill).
    expect(screen.getByRole("heading", { level: 2, name: /Goals/ })).toBeInTheDocument();
    const list = screen.getByRole("list", { name: "Goals" });
    const item = within(list).getByRole("listitem");
    // Rank rides as a medal disc on the avatar corner — still present as text.
    expect(within(item).getByText("1")).toBeInTheDocument();
    // Name + team links intact.
    expect(within(item).getByRole("link", { name: "Erling Haaland" })).toHaveAttribute(
      "href",
      "/players/1",
    );
    // Accent + aria-label preserved on the value.
    const value = screen.getByLabelText("27 Goals");
    expect(value.className).toMatch(/text-amber-600/);
  });

  it("respects the row limit (10) in the badge variant", () => {
    renderWithIntl(
      <StatLeaderboard
        title="Goals"
        valueLabel="Goals"
        variant="badge"
        limit={10}
        entries={makeEntries(10)}
      />,
    );
    const list = screen.getByRole("list", { name: "Goals" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(10);
  });
});
