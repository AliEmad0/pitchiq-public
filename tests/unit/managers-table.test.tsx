import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";

import {
  ManagersTable,
  filterManagerRows,
  sortManagerRows,
} from "../../src/features/managers/components/ManagersTable";
import type { ManagerIndexRow } from "../../src/features/managers/managers-index.api";

import { renderWithIntl } from "./_helpers/intl";

const row = (
  id: string,
  name: string,
  teamName: string,
  points: number,
  ppg = 1,
): ManagerIndexRow => ({
  managerId: id,
  name,
  photo: id,
  nationality: null,
  nationalityCode: null,
  teamId: 1,
  teamName,
  teamLogo: "/l.png",
  record: {
    played: 38,
    win: Math.round(points / 3),
    draw: 0,
    loss: 0,
    gf: 0,
    ga: 0,
    gd: 0,
    points,
    ppg,
    winPct: 0,
  },
});

const ROWS = [
  row("58", "Alex Ferguson", "Man Utd", 90, 2.4),
  row("36", "Rafa Benitez", "Liverpool", 86, 2.3),
];

describe("filterManagerRows", () => {
  it("matches manager or club name", () => {
    expect(filterManagerRows(ROWS, "rafa").map((r) => r.managerId)).toEqual(["36"]);
    expect(filterManagerRows(ROWS, "utd").map((r) => r.managerId)).toEqual(["58"]);
    expect(filterManagerRows(ROWS, "")).toHaveLength(2);
  });
});

describe("sortManagerRows", () => {
  it("sorts by name when key=name", () => {
    expect(sortManagerRows(ROWS, "name").map((r) => r.managerId)).toEqual(["58", "36"]);
  });
  it("keeps points order by default key", () => {
    expect(sortManagerRows(ROWS, "points").map((r) => r.managerId)).toEqual(["58", "36"]);
  });
});

describe("<ManagersTable>", () => {
  it("renders a row per manager with a season-carrying profile link", () => {
    renderWithIntl(
      <NuqsTestingAdapter>
        <ManagersTable rows={ROWS} season={2009} />
      </NuqsTestingAdapter>,
    );
    expect(screen.getByRole("link", { name: /Alex Ferguson/ })).toHaveAttribute(
      "href",
      "/managers/58?season=2009",
    );
    expect(screen.getByText("90")).toBeInTheDocument();
  });
});
