import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

import { SeasonEndedCard } from "@/features/leagues/components/SeasonEndedCard";

afterEach(() => {
  cleanup();
});

describe("<SeasonEndedCard> — TASK-608", () => {
  it("renders the formatted season label (YYYY-YY) in the heading copy", () => {
    render(<SeasonEndedCard season={2024} />);
    // formatSeasonLabel(2024) → "2024-25"
    expect(screen.getByText(/the 2024-25 season has ended/i)).toBeInTheDocument();
  });

  it("links to #standings (the dashboard anchor target) via a native <a>", () => {
    render(<SeasonEndedCard season={2024} />);
    const link = screen.getByRole("link", { name: /view the final standings/i });
    expect(link).toHaveAttribute("href", "#standings");
  });

  it("exposes role='status' + aria-label so screen readers announce the empty-state", () => {
    render(<SeasonEndedCard season={2024} />);
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-label", "Season 2024-25 ended");
  });

  it("re-renders cleanly for a different season (no module-level state leaks)", () => {
    render(<SeasonEndedCard season={2099} />);
    // formatSeasonLabel(2099) → "2099-00" (millennium edge case)
    expect(screen.getByText(/the 2099-00 season has ended/i)).toBeInTheDocument();
  });
});
