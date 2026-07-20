import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, screen } from "@testing-library/react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";

import { TeamFilter, filterTeams, sortTeams } from "@/features/teams/components/TeamFilter";
import type { TeamDetail } from "@/types/api";

import { renderWithIntl } from "./_helpers/intl";

afterEach(() => {
  cleanup();
});

function makeEntry(
  id: number,
  name: string,
  founded: number | null = 1900,
  capacity: number | null = null,
): TeamDetail {
  return {
    team: {
      id,
      name,
      logo: `https://media.example.test/football/teams/${id}.png`,
      code: name.slice(0, 3).toUpperCase(),
      country: "England",
      founded,
      national: false,
      website: null,
    },
    venue: {
      id: null,
      name: null,
      address: null,
      city: null,
      capacity,
      surface: null,
      image: null,
    },
  };
}

const baseTeams: TeamDetail[] = [
  makeEntry(33, "Manchester United", 1878),
  makeEntry(50, "Manchester City", 1880),
  makeEntry(40, "Liverpool", 1892),
  makeEntry(42, "Arsenal", 1886),
  makeEntry(47, "Tottenham Hotspur", 1882),
];

describe("filterTeams", () => {
  it("returns the full list when the query is empty", () => {
    expect(filterTeams(baseTeams, "")).toEqual(baseTeams);
  });

  it("returns the full list when the query is whitespace-only", () => {
    expect(filterTeams(baseTeams, "   ")).toEqual(baseTeams);
  });

  it("case-insensitively matches the substring against team.name", () => {
    expect(filterTeams(baseTeams, "manchester").map((e) => e.team.id)).toEqual([33, 50]);
    expect(filterTeams(baseTeams, "MAN").map((e) => e.team.id)).toEqual([33, 50]);
    expect(filterTeams(baseTeams, "liver").map((e) => e.team.id)).toEqual([40]);
  });

  it("trims leading and trailing whitespace before matching", () => {
    expect(filterTeams(baseTeams, "  liver  ").map((e) => e.team.id)).toEqual([40]);
  });

  it("returns an empty list when nothing matches", () => {
    expect(filterTeams(baseTeams, "xyz")).toEqual([]);
  });
});

describe("sortTeams (TASK-1505)", () => {
  it("A–Z sorts by team name", () => {
    expect(sortTeams(baseTeams, "az").map((e) => e.team.name)).toEqual([
      "Arsenal",
      "Liverpool",
      "Manchester City",
      "Manchester United",
      "Tottenham Hotspur",
    ]);
  });

  it("Founded sorts oldest-first, with null founded last", () => {
    const withNull = [...baseTeams, makeEntry(1, "Newish FC", null)];
    // 1878, 1880, 1882, 1886, 1892, then the null.
    expect(sortTeams(withNull, "founded").map((e) => e.team.id)).toEqual([33, 50, 47, 42, 40, 1]);
  });

  it("Capacity sorts biggest-first, with null capacity last", () => {
    const a = makeEntry(10, "Big", 1900, 50000);
    const b = makeEntry(11, "Mid", 1900, 30000);
    const c = makeEntry(12, "Unknown", 1900, null);
    expect(sortTeams([c, b, a], "capacity").map((e) => e.team.id)).toEqual([10, 11, 12]);
  });

  it("does not mutate its input", () => {
    const input = [...baseTeams];
    const before = input.map((e) => e.team.id);
    sortTeams(input, "az");
    expect(input.map((e) => e.team.id)).toEqual(before);
  });
});

describe("TeamFilter", () => {
  it("renders every team's name and link by default", () => {
    renderWithIntl(
      <NuqsTestingAdapter>
        <TeamFilter season={2024} teams={baseTeams} />
      </NuqsTestingAdapter>,
    );
    for (const entry of baseTeams) {
      // Each tile is wrapped in a Link; the aria-label on the link is the
      // team name (set so screen readers don't read the founded chip first).
      expect(screen.getByRole("link", { name: entry.team.name })).toBeTruthy();
    }
  });

  it("wraps each tile in a <Link> to /teams/<id>", () => {
    renderWithIntl(
      <NuqsTestingAdapter>
        <TeamFilter season={2024} teams={baseTeams} />
      </NuqsTestingAdapter>,
    );
    const liverpoolLink = screen.getByRole("link", { name: "Liverpool" });
    expect(liverpoolLink.getAttribute("href")).toBe("/teams/40?season=2024");
  });

  it("renders the founded year on tiles that have one", () => {
    renderWithIntl(
      <NuqsTestingAdapter>
        <TeamFilter season={2024} teams={baseTeams} />
      </NuqsTestingAdapter>,
    );
    expect(screen.getByText("est. 1878")).toBeTruthy();
    expect(screen.getByText("est. 1892")).toBeTruthy();
  });

  it("omits the founded chip when founded is null", () => {
    renderWithIntl(
      <NuqsTestingAdapter>
        <TeamFilter season={2024} teams={[makeEntry(999, "Newish FC", null)]} />
      </NuqsTestingAdapter>,
    );
    expect(screen.getByRole("link", { name: "Newish FC" })).toBeTruthy();
    expect(screen.queryByText(/^est\. /)).toBeNull();
  });

  it("uses the responsive grid breakpoints prescribed by the AC (2/3/5)", () => {
    const { container } = renderWithIntl(
      <NuqsTestingAdapter>
        <TeamFilter season={2024} teams={baseTeams} />
      </NuqsTestingAdapter>,
    );
    const grid = container.querySelector("ul");
    expect(grid).not.toBeNull();
    expect(grid!.className).toContain("grid-cols-2");
    expect(grid!.className).toContain("sm:grid-cols-3");
    expect(grid!.className).toContain("lg:grid-cols-5");
  });

  it("narrows the visible list as the user types in the filter input", () => {
    renderWithIntl(
      <NuqsTestingAdapter>
        <TeamFilter season={2024} teams={baseTeams} />
      </NuqsTestingAdapter>,
    );
    const input = screen.getByLabelText("Filter clubs") as HTMLInputElement;

    fireEvent.change(input, { target: { value: "manchester" } });

    // Both Manchester clubs survive
    expect(screen.getByRole("link", { name: "Manchester United" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Manchester City" })).toBeTruthy();
    // Liverpool / Arsenal / Spurs are filtered out
    expect(screen.queryByRole("link", { name: "Liverpool" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Arsenal" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Tottenham Hotspur" })).toBeNull();
  });

  it("renders the empty state when the filter matches nothing", () => {
    renderWithIntl(
      <NuqsTestingAdapter>
        <TeamFilter season={2024} teams={baseTeams} />
      </NuqsTestingAdapter>,
    );
    const input = screen.getByLabelText("Filter clubs") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "xyz" } });

    // Component uses curly quotes (&ldquo; / &rdquo;).
    expect(screen.getByRole("status").textContent).toContain("xyz");
    expect(screen.getByRole("status").textContent).toContain("No clubs match");
    // No link survives
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("reads the initial `q` from the URL via nuqs", () => {
    renderWithIntl(
      <NuqsTestingAdapter searchParams="?q=liver">
        <TeamFilter season={2024} teams={baseTeams} />
      </NuqsTestingAdapter>,
    );
    // Only Liverpool should render initially.
    expect(screen.getByRole("link", { name: "Liverpool" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Arsenal" })).toBeNull();
    const input = screen.getByLabelText("Filter clubs") as HTMLInputElement;
    expect(input.value).toBe("liver");
  });

  it("renders the sort control with A–Z active by default (TASK-1505)", () => {
    renderWithIntl(
      <NuqsTestingAdapter>
        <TeamFilter season={2024} teams={baseTeams} />
      </NuqsTestingAdapter>,
    );
    expect(screen.getByRole("button", { name: "A–Z" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "Founded" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Capacity" })).toBeTruthy();
  });

  it("shows a live count that updates as the filter narrows (TASK-1505)", () => {
    renderWithIntl(
      <NuqsTestingAdapter>
        <TeamFilter season={2024} teams={baseTeams} />
      </NuqsTestingAdapter>,
    );
    expect(screen.getByText(/5 clubs · click a card/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Filter clubs"), { target: { value: "manchester" } });
    expect(screen.getByText("Showing 2 of 5 clubs")).toBeTruthy();
  });
});
