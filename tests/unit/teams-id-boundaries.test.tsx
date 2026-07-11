import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

// not-found.tsx is a Server Component that localizes via getTranslations
// (TASK-1603); mock next-intl/server so `render(await TeamNotFound())` resolves
// the real English strings without a request context.
vi.mock("next-intl/server", () => import("./_helpers/intl-server"));

import TeamProfileLoading from "@/app/[locale]/teams/[id]/loading";
import TeamNotFound from "@/app/[locale]/teams/[id]/not-found";

import { renderWithIntl } from "./_helpers/intl";

afterEach(() => {
  cleanup();
});

// loading.tsx renders <SquadGridSkeleton>, which localizes via useTranslations
// (TASK-1603 batch 4) → wrap in the intl provider. The not-found tests below use
// bare `render(await …)` since BoundaryPanel is prop-driven (no hooks).
describe("/teams/[id] loading.tsx", () => {
  it("renders a live status region announced as the team-profile loader", () => {
    renderWithIntl(<TeamProfileLoading />);

    const status = screen.getByRole("status", {
      name: "Loading team profile",
    });
    expect(status).toBeTruthy();
    expect(status.getAttribute("aria-live")).toBe("polite");
  });

  it("includes a hero placeholder + the three section skeletons (stats / form / squad)", () => {
    const { container } = renderWithIntl(<TeamProfileLoading />);
    // Each section skeleton carries role="status" or aria-label; the
    // section skeletons should appear as descendants of the outer <main>.
    const main = container.querySelector("main");
    expect(main).not.toBeNull();
    // The outer main + 4 nested status regions = 5 total.
    // (TeamStatsTilesSkeleton ul carries role=status; SquadGridSkeleton
    // exposes multiple PlayerChipSkeleton role=status regions; the form
    // skeleton card itself is role=status. We assert the count is at
    // least 5 to allow for nested skeletons.)
    const statusNodes = container.querySelectorAll('[role="status"]');
    expect(statusNodes.length).toBeGreaterThanOrEqual(5);
  });

  it("uses the same container-page width as the real team page", () => {
    const { container } = renderWithIntl(<TeamProfileLoading />);
    const main = container.querySelector("main");
    expect(main?.className).toContain("container-page");
  });
});

describe("/teams/[id] not-found.tsx", () => {
  it("renders the team-specific 404 copy and two routing actions", async () => {
    render(await TeamNotFound());

    // CardTitle is a div, not a semantic heading — match by text.
    expect(screen.getByText(/Team not found/)).toBeTruthy();
    // CardDescription mentions the dataset (TASK-609 reworded from
    // "wire dataset" → "our Premier League dataset").
    expect(screen.getByText(/our Premier League dataset/i)).toBeTruthy();
    // Two link buttons: /teams index + dashboard
    const browseLink = screen.getByRole("link", { name: /Browse all clubs/ });
    expect(browseLink.getAttribute("href")).toBe("/teams");
    const dashboardLink = screen.getByRole("link", { name: /Dashboard/ });
    expect(dashboardLink.getAttribute("href")).toBe("/");
  });

  it("uses different copy from the root not-found (this is the team-scoped boundary)", async () => {
    render(await TeamNotFound());
    // Root not-found's heading is "Page not found"; team-scoped is "Team
    // not found". Assert we are NOT the root copy.
    expect(screen.queryByText("Page not found")).toBeNull();
  });
});
