import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, screen } from "@testing-library/react";

import { renderWithIntl } from "./_helpers/intl";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/"),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

import { usePathname, useSearchParams, type ReadonlyURLSearchParams } from "next/navigation";

import { PrimaryNav } from "@/components/layout/PrimaryNav";

const mockPathname = vi.mocked(usePathname);
const mockSearchParams = vi.mocked(useSearchParams);

// next's useSearchParams is typed to return ReadonlyURLSearchParams; a plain
// URLSearchParams is structurally compatible at runtime for our `.get()` read.
const sp = (q = ""): ReadonlyURLSearchParams =>
  new URLSearchParams(q) as unknown as ReadonlyURLSearchParams;

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("PrimaryNav — segmented pill (Phase 15)", () => {
  it("renders the primary pill links inline", () => {
    mockPathname.mockReturnValue("/");
    mockSearchParams.mockReturnValue(sp());
    renderWithIntl(<PrimaryNav />);

    for (const label of ["Dashboard", "Teams", "Players", "Fixtures", "Compare"]) {
      expect(screen.getByRole("link", { name: label })).toBeInTheDocument();
    }
  });

  it("folds secondary sections into a 'More' dropdown (closed by default)", () => {
    mockPathname.mockReturnValue("/");
    mockSearchParams.mockReturnValue(sp());
    renderWithIntl(<PrimaryNav />);

    expect(screen.getByRole("button", { name: /more sections/i })).toBeInTheDocument();
    // The overflow items are only rendered once the dropdown opens.
    expect(screen.queryByRole("link", { name: "Managers" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Leaderboards" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Map" })).toBeNull();
  });

  it("marks the active primary link with aria-current", () => {
    mockPathname.mockReturnValue("/teams");
    mockSearchParams.mockReturnValue(sp());
    renderWithIntl(<PrimaryNav />);

    expect(screen.getByRole("link", { name: "Teams" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Compare" })).not.toHaveAttribute("aria-current");
  });

  it("carries the active season onto the pill links", () => {
    mockPathname.mockReturnValue("/");
    mockSearchParams.mockReturnValue(sp("season=2003"));
    renderWithIntl(<PrimaryNav />);

    expect(screen.getByRole("link", { name: "Teams" })).toHaveAttribute(
      "href",
      "/teams?season=2003",
    );
  });
});
