import { screen } from "@testing-library/react";

import { renderWithIntl } from "./_helpers/intl";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Footer } from "@/components/layout/Footer";
import { loadMeta } from "@/data/loaders";

vi.mock("@/data/loaders", () => ({
  loadMeta: vi.fn(),
}));

// Footer is a Server Component that reads its copy via getTranslations (TASK-1603).
vi.mock("next-intl/server", () => import("./_helpers/intl-server"));

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Footer", () => {
  it("renders the Wikimedia + GitHub credit links", async () => {
    vi.mocked(loadMeta).mockResolvedValueOnce(null);
    renderWithIntl(await Footer());
    expect(screen.getByRole("link", { name: /Wikimedia Commons/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /GitHub/i })).toBeInTheDocument();
  });

  it("renders the Explore + Compete navigation columns", async () => {
    vi.mocked(loadMeta).mockResolvedValueOnce(null);
    renderWithIntl(await Footer());
    // Internal nav links (Phase 15 multi-column footer).
    expect(screen.getByRole("link", { name: "Teams" })).toHaveAttribute("href", "/teams");
    expect(screen.getByRole("link", { name: "Leaderboards" })).toHaveAttribute(
      "href",
      "/leaderboards",
    );
    expect(screen.getByRole("link", { name: "Compare" })).toHaveAttribute("href", "/compare");
  });

  it("shows a relative 'data updated' stamp from _meta.lastRefresh", async () => {
    const recent = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(); // 2 days ago
    vi.mocked(loadMeta).mockResolvedValueOnce({
      lastRefresh: recent,
      datasets: [],
      seasons: [2025],
      rowCounts: {},
    });
    renderWithIntl(await Footer());
    expect(screen.getByText(/Data updated 2 days ago\./i)).toBeInTheDocument();
  });

  it("omits the freshness stamp (and the dropped 'Refreshed daily' copy) when meta is missing", async () => {
    vi.mocked(loadMeta).mockResolvedValueOnce(null);
    renderWithIntl(await Footer());
    expect(screen.queryByText(/Refreshed daily/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Data updated/i)).not.toBeInTheDocument();
    // The brand tagline still renders.
    expect(screen.getByText(/Premier League, decoded/i)).toBeInTheDocument();
  });
});
