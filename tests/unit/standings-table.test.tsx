import { afterEach, describe, expect, it } from "vitest";
import { cleanup, screen, within } from "@testing-library/react";

import { StandingsTable } from "@/features/leagues/components/StandingsTable";
import type { StandingsRow } from "@/types/api";

import standingsFixture from "../fixtures/wire/standings.json";

import { renderWithIntl } from "./_helpers/intl";

afterEach(() => {
  cleanup();
});

const liveRows = (standingsFixture.response[0]?.league.standings[0] ?? []) as StandingsRow[];

function makeRow(overrides: Partial<StandingsRow> = {}): StandingsRow {
  return {
    rank: 1,
    team: { id: 50, name: "Manchester City", logo: "https://logo/50.png" },
    points: 28,
    goalsDiff: 18,
    group: "Premier League",
    form: "WWWWW",
    status: "same",
    description: null,
    all: {
      played: 10,
      win: 9,
      draw: 1,
      lose: 0,
      goals: { for: 25, against: 7 },
    },
    home: {
      played: 5,
      win: 5,
      draw: 0,
      lose: 0,
      goals: { for: 14, against: 3 },
    },
    away: {
      played: 5,
      win: 4,
      draw: 1,
      lose: 0,
      goals: { for: 11, against: 4 },
    },
    update: "2024-10-27T00:00:00+00:00",
    ...overrides,
  };
}

describe("StandingsTable — happy path against live fixture", () => {
  it("renders one body row per StandingsRow, plus the header row", () => {
    renderWithIntl(<StandingsTable season={2024} rows={liveRows} />);

    // 1 header row + N body rows.
    expect(screen.getAllByRole("row")).toHaveLength(liveRows.length + 1);
  });

  it("links each club name to /teams/<teamId>", () => {
    renderWithIntl(<StandingsTable season={2024} rows={liveRows} />);

    for (const row of liveRows) {
      const link = screen.getByRole("link", { name: new RegExp(row.team.name) });
      expect(link).toHaveAttribute("href", `/teams/${row.team.id}?season=2024`);
    }
  });

  it("renders all configured column headers in order", () => {
    renderWithIntl(<StandingsTable season={2024} rows={liveRows} />);

    const headers = screen.getAllByRole("columnheader").map((th) => th.textContent?.trim());
    expect(headers).toEqual(["#", "Club", "MP", "W", "D", "L", "GF", "GA", "GD", "Form", "Pts"]);
  });
});

describe("StandingsTable — form chips", () => {
  it("splits the form string into 5 chips, last-match-rightmost", () => {
    renderWithIntl(<StandingsTable season={2024} rows={[makeRow({ form: "LWDWW" })]} />);

    const formList = screen.getByRole("list", {
      name: /recent form/i,
    });
    const chips = within(formList).getAllByRole("listitem");
    expect(chips.map((c) => c.textContent)).toEqual(["L", "W", "D", "W", "W"]);
  });

  it("only renders the LAST 5 results when form is longer than 5", () => {
    renderWithIntl(<StandingsTable season={2024} rows={[makeRow({ form: "WWWWWLDWWW" })]} />);

    const formList = screen.getByRole("list", { name: /recent form/i });
    const chips = within(formList).getAllByRole("listitem");
    expect(chips).toHaveLength(5);
    expect(chips.map((c) => c.textContent)).toEqual(["L", "D", "W", "W", "W"]);
  });

  it("shows an em-dash when form is the empty string", () => {
    renderWithIntl(<StandingsTable season={2024} rows={[makeRow({ form: "" })]} />);

    expect(screen.getByLabelText(/no recent form/i)).toHaveTextContent("—");
  });

  it("labels each chip with its result name for screen readers", () => {
    renderWithIntl(<StandingsTable season={2024} rows={[makeRow({ form: "WDL" })]} />);

    expect(screen.getByLabelText("Win")).toBeInTheDocument();
    expect(screen.getByLabelText("Draw")).toBeInTheDocument();
    expect(screen.getByLabelText("Loss")).toBeInTheDocument();
  });
});

describe("StandingsTable — qualification styling driven by description", () => {
  // Palette matches the official PL broadcast graphic: CL=blue, UEL=orange,
  // UECL=green, Relegation=red. Updated alongside the per-team qualification
  // map in `src/features/leagues/api.ts`.

  it("applies blue border + blue row tint on Champions League rows", () => {
    renderWithIntl(
      <StandingsTable
        season={2024}
        rows={[
          makeRow({
            description: "Promotion - Champions League (Group Stage)",
          }),
        ]}
      />,
    );

    const row = screen.getAllByRole("row").at(-1)!;
    // TASK-1505: the qualification border lives on the frozen # cell (first
    // cell) so it stays pinned during horizontal scroll — not on the row.
    const numberCell = within(row).getAllByRole("cell")[0];
    expect(numberCell.className).toMatch(/border-s-blue-500/);
    expect(numberCell.className).toMatch(/border-s-4/);
    // TASK-1504: light mode shows ONLY the coloured left border — the full-row
    // tint is dark-mode only.
    expect(row.className).not.toMatch(/bg-blue-50/);
    expect(row.className).toMatch(/dark:bg-blue-950\/40/);
  });

  it("applies orange border + orange row tint on Europa League rows", () => {
    renderWithIntl(
      <StandingsTable
        season={2024}
        rows={[makeRow({ description: "Promotion - Europa League" })]}
      />,
    );
    const row = screen.getAllByRole("row").at(-1)!;
    expect(within(row).getAllByRole("cell")[0].className).toMatch(/border-s-orange-500/);
    expect(row.className).not.toMatch(/bg-orange-50/);
    expect(row.className).toMatch(/dark:bg-orange-950\/40/);
  });

  it("applies green border + green row tint on Conference League rows", () => {
    renderWithIntl(
      <StandingsTable
        season={2024}
        rows={[makeRow({ description: "Promotion - Conference League" })]}
      />,
    );
    const row = screen.getAllByRole("row").at(-1)!;
    expect(within(row).getAllByRole("cell")[0].className).toMatch(/border-s-green-500/);
    expect(row.className).not.toMatch(/bg-green-50/);
    expect(row.className).toMatch(/dark:bg-green-950\/40/);
  });

  it("applies red border + red row tint on Relegation rows", () => {
    renderWithIntl(
      <StandingsTable
        season={2024}
        rows={[makeRow({ description: "Relegation - Championship" })]}
      />,
    );
    const row = screen.getAllByRole("row").at(-1)!;
    expect(within(row).getAllByRole("cell")[0].className).toMatch(/border-s-red-500/);
    expect(row.className).not.toMatch(/bg-red-50/);
    expect(row.className).toMatch(/dark:bg-red-950\/40/);
  });

  it("applies no border or tint when description is null (mid-table)", () => {
    renderWithIntl(<StandingsTable season={2024} rows={[makeRow({ description: null })]} />);

    const row = screen.getAllByRole("row").at(-1)!;
    // No qualification border on the frozen # cell (TASK-1505).
    expect(within(row).getAllByRole("cell")[0].className).not.toMatch(
      /border-s-(blue|orange|green|red)-500/,
    );
    expect(row.className).not.toMatch(/bg-(blue|orange|green|red)-50/);
    // Mid-table rows keep the zebra-stripe alternation.
    expect(row.className).toMatch(/even:bg-muted\/30/);
  });

  it("tinted rows skip the zebra-stripe (no double background)", () => {
    renderWithIntl(
      <StandingsTable
        season={2024}
        rows={[makeRow({ description: "Promotion - Champions League (Group Stage)" })]}
      />,
    );
    const row = screen.getAllByRole("row").at(-1)!;
    expect(row.className).not.toMatch(/even:bg-muted\/30/);
  });

  it("keeps the sticky # + Club cells FULLY opaque, even on a tinted row (TASK-1504)", () => {
    renderWithIntl(
      <StandingsTable
        season={2024}
        rows={[makeRow({ description: "Promotion - Champions League (Group Stage)" })]}
      />,
    );
    // First two cells in the body row are the sticky # + Club cells. They MUST be
    // fully opaque bg-card so the middle columns can't scroll through them and
    // overlap the text on mobile — and must NOT carry the translucent dark tint
    // (`bg-…-950/40`), which would override bg-card and re-introduce bleed-through
    // in dark mode. The tint stays on the middle columns + the left border.
    const cells = screen.getAllByRole("cell");
    expect(cells[0].className).toMatch(/bg-card/);
    expect(cells[0].className).not.toMatch(/950\/40/);
    expect(cells[1].className).toMatch(/bg-card/);
    expect(cells[1].className).not.toMatch(/950\/40/);
  });
});

describe("StandingsTable — qualification legend", () => {
  it("renders the legend with the labels derived from the rows' descriptions", () => {
    // The legend is derived from the descriptions actually present (TASK-M04),
    // so it shows era-correct names + only the competitions in this season.
    renderWithIntl(
      <StandingsTable
        season={2024}
        rows={[
          makeRow({ rank: 1, description: "Promotion - Champions League (Group Stage)" }),
          makeRow({ rank: 5, description: "Promotion - Europa League" }),
          makeRow({ rank: 7, description: "Promotion - Conference League" }),
          makeRow({ rank: 20, description: "Relegation - Championship" }),
        ]}
      />,
    );
    const legend = screen.getByLabelText(/Qualification legend/i);
    expect(legend).toBeInTheDocument();
    expect(within(legend).getByText("Champions League")).toBeInTheDocument();
    expect(within(legend).getByText("Europa League")).toBeInTheDocument();
    expect(within(legend).getByText("Conference League")).toBeInTheDocument();
    expect(within(legend).getByText("Relegation")).toBeInTheDocument();
  });

  it("shows era-accurate legend labels for an older season (UEFA Cup / Cup Winners' Cup)", () => {
    renderWithIntl(
      <StandingsTable
        season={2024}
        rows={[
          makeRow({ rank: 1, description: "Promotion - Champions League (Group Stage)" }),
          makeRow({ rank: 2, description: "Promotion - UEFA Cup" }),
          makeRow({ rank: 3, description: "Promotion - Cup Winners' Cup" }),
        ]}
      />,
    );
    const legend = screen.getByLabelText(/Qualification legend/i);
    expect(within(legend).getByText("UEFA Cup")).toBeInTheDocument();
    expect(within(legend).getByText("Cup Winners' Cup")).toBeInTheDocument();
    // No relegation/Conference rows supplied → those labels are absent.
    expect(within(legend).queryByText("Conference League")).not.toBeInTheDocument();
  });

  it("renders the qualification key inline — always visible, no toggle (TASK-1504)", () => {
    renderWithIntl(<StandingsTable season={2024} rows={liveRows} />);
    expect(screen.getByLabelText(/Qualification legend/i)).toBeInTheDocument();
    // The old collapsible "Show qualification legend" summary is gone.
    expect(screen.queryByText(/show qualification legend/i)).not.toBeInTheDocument();
  });

  it("does NOT render the legend when rows are empty", () => {
    renderWithIntl(<StandingsTable season={2024} rows={[]} />);
    expect(screen.queryByLabelText(/Qualification legend/i)).not.toBeInTheDocument();
  });
});

describe("StandingsTable — goal difference formatting", () => {
  it("prefixes positive GD with '+'", () => {
    renderWithIntl(<StandingsTable season={2024} rows={[makeRow({ goalsDiff: 18 })]} />);
    expect(screen.getByText("+18")).toBeInTheDocument();
  });

  it("renders negative GD with its native sign", () => {
    renderWithIntl(<StandingsTable season={2024} rows={[makeRow({ goalsDiff: -7 })]} />);
    expect(screen.getByText("-7")).toBeInTheDocument();
  });

  it("renders zero GD without a sign", () => {
    // Override defaults so the only "0" in the row is the GD cell.
    renderWithIntl(
      <StandingsTable
        season={2024}
        rows={[
          makeRow({
            goalsDiff: 0,
            all: {
              played: 10,
              win: 5,
              draw: 5,
              lose: 4,
              goals: { for: 12, against: 12 },
            },
          }),
        ]}
      />,
    );
    expect(screen.getByText("0")).toBeInTheDocument();
  });
});

describe("StandingsTable — empty state", () => {
  it("renders only the header row when rows is empty", () => {
    renderWithIntl(<StandingsTable season={2024} rows={[]} />);
    expect(screen.getAllByRole("row")).toHaveLength(1);
  });
});
