import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

import { PlayerChipSkeleton } from "@/components/skeletons/PlayerChipSkeleton";
import { StatCardSkeleton } from "@/components/skeletons/StatCardSkeleton";
import { TableRowSkeleton } from "@/components/skeletons/TableRowSkeleton";

afterEach(() => {
  cleanup();
});

function countSkeletons() {
  return document.querySelectorAll('[data-slot="skeleton"]').length;
}

describe("TableRowSkeleton", () => {
  it("renders a status region with skeleton primitives for the default single row", () => {
    render(<TableRowSkeleton />);

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(countSkeletons()).toBeGreaterThan(0);
  });

  it("scales the rendered skeleton count linearly with the `count` prop", () => {
    render(<TableRowSkeleton count={1} />);
    const perRow = countSkeletons();
    cleanup();

    render(<TableRowSkeleton count={4} />);
    expect(countSkeletons()).toBe(perRow * 4);
  });

  it("merges a forwarded className onto the wrapper", () => {
    render(<TableRowSkeleton className="custom-table-class" />);

    expect(screen.getByRole("status")).toHaveClass("custom-table-class");
  });
});

describe("StatCardSkeleton", () => {
  it("renders the default 5 rows inside a single card", () => {
    render(<StatCardSkeleton />);

    expect(screen.getByRole("status")).toBeInTheDocument();
    // 2 header skeletons + 5 rows × 5 skeletons per row
    expect(countSkeletons()).toBe(2 + 5 * 5);
  });

  it("scales by card count", () => {
    render(<StatCardSkeleton count={3} />);

    expect(screen.getAllByRole("status")).toHaveLength(3);
  });

  it("respects a custom `rows` prop", () => {
    render(<StatCardSkeleton rows={3} />);

    // 2 header skeletons + 3 rows × 5 skeletons per row
    expect(countSkeletons()).toBe(2 + 3 * 5);
  });
});

describe("PlayerChipSkeleton", () => {
  it("renders a single chip by default", () => {
    render(<PlayerChipSkeleton />);

    expect(screen.getByRole("status")).toBeInTheDocument();
    // 1 avatar + 2 text bars per chip
    expect(countSkeletons()).toBe(3);
  });

  it("scales the rendered skeleton count linearly with the `count` prop", () => {
    render(<PlayerChipSkeleton count={5} />);

    expect(countSkeletons()).toBe(3 * 5);
  });
});
