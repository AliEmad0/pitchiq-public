import { cleanup, screen, waitFor } from "@testing-library/react";
import { renderWithIntl } from "./_helpers/intl";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { ShareBanner } from "@/features/players/components/ShareBanner";

const STORAGE_KEY = "compare:share-banner-dismissed";

beforeEach(() => {
  // happy-dom carries sessionStorage across tests in the same suite — wipe
  // the dismissal flag so each test starts from a known clean state.
  sessionStorage.removeItem(STORAGE_KEY);
});

afterEach(() => {
  cleanup();
  sessionStorage.removeItem(STORAGE_KEY);
});

describe("ShareBanner", () => {
  it("renders the shareable copy on a fresh session", async () => {
    renderWithIntl(<ShareBanner />);
    // First paint renders nothing (mounted flag is false) — wait for the
    // useEffect that reads sessionStorage to flip mounted=true.
    await screen.findByText(/shareable/i);
    expect(screen.getByRole("button", { name: /dismiss/i })).toBeInTheDocument();
  });

  it("hides the banner and writes to sessionStorage when dismissed", async () => {
    const user = userEvent.setup();
    renderWithIntl(<ShareBanner />);

    const dismissBtn = await screen.findByRole("button", {
      name: /dismiss/i,
    });
    await user.click(dismissBtn);

    // The banner disappears…
    await waitFor(() => expect(screen.queryByText(/shareable/i)).not.toBeInTheDocument());
    // …and the dismissal flag is written so a re-render in the same
    // session doesn't re-show it.
    expect(sessionStorage.getItem(STORAGE_KEY)).toBe("1");
  });

  it("stays hidden when sessionStorage already has the dismissal flag", async () => {
    sessionStorage.setItem(STORAGE_KEY, "1");
    renderWithIntl(<ShareBanner />);

    // Give the mount-effect a tick to run; assert the banner never appears.
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(screen.queryByText(/shareable/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /dismiss/i })).not.toBeInTheDocument();
  });

  // Note: there's no test for "renders null on the server-equivalent
  // first render". The hydration-safety is a structural property —
  // `useEffect` never runs server-side, so the SSR pass with
  // `mounted=false` produces empty markup that the client's first
  // synchronous render (also `mounted=false`) matches. But once
  // `@testing-library/react`'s `render()` returns, the mount-effect has
  // already flushed and the banner is in the DOM. The contract is
  // enforced by reading the source rather than by observation here.
});
