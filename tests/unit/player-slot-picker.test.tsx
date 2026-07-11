import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import en from "@/i18n/messages/en.json";
import { PlayerSlotPicker } from "@/features/players/components/PlayerSlotPicker";
import type { PlayerSearchHit } from "@/features/players/api";

const FERNANDES: PlayerSearchHit = {
  id: 1485,
  name: "Bruno Fernandes",
  team: {
    id: 33,
    name: "Manchester United",
    logo: "https://media.api-sports.io/football/teams/33.png",
  },
  photo: "https://media.api-sports.io/football/players/1485.png",
};

function jsonResponse<T>(body: T, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
    ...init,
  });
}

function renderSlot(slot: "A" | "B", searchParams = "") {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      <QueryClientProvider client={client}>
        <NuqsTestingAdapter searchParams={searchParams}>
          <PlayerSlotPicker slot={slot} />
        </NuqsTestingAdapter>
      </QueryClientProvider>
    </NextIntlClientProvider>,
  );
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("PlayerSlotPicker", () => {
  beforeEach(() => {
    // URL-aware default: the /seasons endpoint returns a seasons list, every
    // other fetch returns Fernandes. Individual tests override as needed.
    vi.spyOn(global, "fetch").mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/seasons")) return jsonResponse({ seasons: [2024, 2023] });
      return jsonResponse(FERNANDES);
    });
  });

  it("renders the search input when the slot is empty (no ?a= in URL)", () => {
    renderSlot("A");
    expect(screen.getByPlaceholderText(/search player a/i)).toBeInTheDocument();
    // No fetch should fire for an empty slot.
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("hydrates the slim player from /api/players/[id] when the URL has the slot id", async () => {
    renderSlot("A", "?a=1485");

    await screen.findByText("Bruno Fernandes");
    expect(screen.getByText("Manchester United")).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/api/players/1485"));
    // The player name links to the profile page; the team name to the team page.
    expect(screen.getByRole("link", { name: "Bruno Fernandes" })).toHaveAttribute(
      "href",
      "/players/1485",
    );
  });

  it("shows the Change button when populated and clears the slot when clicked", async () => {
    renderSlot("B", "?b=1485");
    await screen.findByText("Bruno Fernandes");

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /change/i }));

    // After clearing, the search input is back — and the populated card is gone.
    await waitFor(() =>
      expect(screen.getByPlaceholderText(/search player b/i)).toBeInTheDocument(),
    );
    expect(screen.queryByText("Bruno Fernandes")).not.toBeInTheDocument();
  });

  it("treats a 404 from /api/players/[id] as stale URL state and falls back to the search input", async () => {
    vi.mocked(global.fetch).mockResolvedValue(
      jsonResponse({ error: "player_not_found" }, { status: 404 }),
    );

    renderSlot("A", "?a=999999");

    // The card should never render. Wait for the search input to appear,
    // signalling the picker cleared the stale slot.
    await screen.findByPlaceholderText(/search player a/i);
    expect(screen.queryByText("Bruno Fernandes")).not.toBeInTheDocument();
  });

  it("forwards the optional `season` prop to the slim hydrate", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <QueryClientProvider client={client}>
          <NuqsTestingAdapter searchParams="?a=1485">
            <PlayerSlotPicker slot="A" season={2024} />
          </NuqsTestingAdapter>
        </QueryClientProvider>
      </NextIntlClientProvider>,
    );

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    // Two queries fire (slim + seasons) in no guaranteed order — assert the
    // slim hydrate call specifically (the /seasons URL has no season param).
    const slimCall = vi
      .mocked(global.fetch)
      .mock.calls.map((c) => String(c[0]))
      .find((u) => u.includes("/api/players/1485") && !u.includes("/seasons"));
    expect(slimCall).toMatch(/season=2024/);
  });

  it("renders the per-slot season dropdown (player's seasons + All seasons)", async () => {
    renderSlot("A", "?a=1485");
    await screen.findByText("Bruno Fernandes");
    // Radix Select renders a combobox trigger with the aria-label.
    expect(
      await screen.findByRole("combobox", { name: /season for player a/i }),
    ).toBeInTheDocument();
  });

  it("only manages its own slot — A and B render independently", async () => {
    // Slot A has Fernandes (id 1485), slot B is empty. Slot B's picker
    // should NOT fetch and should render the search input. This is the
    // "Change clears that slot only" AC stated as composition.
    const wrapper = ({ children }: { children: ReactNode }) => {
      const client = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });
      return (
        <NextIntlClientProvider locale="en" messages={en}>
          <QueryClientProvider client={client}>
            <NuqsTestingAdapter searchParams="?a=1485">{children}</NuqsTestingAdapter>
          </QueryClientProvider>
        </NextIntlClientProvider>
      );
    };

    render(
      <>
        <PlayerSlotPicker slot="A" />
        <PlayerSlotPicker slot="B" />
      </>,
      { wrapper },
    );

    await screen.findByText("Bruno Fernandes");
    expect(screen.getByPlaceholderText(/search player b/i)).toBeInTheDocument();
  });

  // Post-snapshot migration: all `data.photo` values come back as "" from the
  // /api/players/[id] route because snapshot player rows lack photo URLs and
  // getPlayerSlim falls back to `""`. Passing "" or null to `<Image src>`
  // trips Next's dev-mode console errors ("An empty string was passed to
  // src" / "Image is missing required 'src' property"). These two tests
  // pin the photo-fallback behavior so a future refactor can't regress
  // back to passing falsy values into <Image>.

  it("renders initials fallback (not an empty <img>) when photo is the empty string", async () => {
    // mockImplementation (fresh Response per call) — the slim + seasons queries
    // both fire, so a single shared Response body would be double-read.
    vi.mocked(global.fetch).mockImplementation(async (input: RequestInfo | URL) => {
      if (String(input).includes("/seasons")) return jsonResponse({ seasons: [2024] });
      return jsonResponse<PlayerSearchHit>({
        id: 1485,
        name: "Bruno Fernandes",
        team: { id: 33, name: "Manchester United", logo: "/logos/33.png" },
        photo: "", // the live snapshot shape
      });
    });

    renderSlot("A", "?a=1485");

    await screen.findByText("Bruno Fernandes");
    // "BF" — first + last initials from "Bruno Fernandes". If PlayerImage had
    // rendered a broken <img src=""> instead of the monogram, this would fail.
    expect(screen.getByText("BF")).toBeInTheDocument();
    // TASK-1513: the card now shows a decorative club crest (alt="" → role
    // presentation), so there's no *accessible* image — the player photo itself
    // still falls back to the initials monogram, not a broken <img>.
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("renders initials for single-word player names too", async () => {
    vi.mocked(global.fetch).mockImplementation(async (input: RequestInfo | URL) => {
      if (String(input).includes("/seasons")) return jsonResponse({ seasons: [2024] });
      return jsonResponse<PlayerSearchHit>({
        id: 99,
        name: "Pele",
        team: { id: 33, name: "Santos", logo: "/logos/santos.png" },
        photo: "",
      });
    });

    renderSlot("A", "?a=99");

    await screen.findByText("Pele");
    expect(screen.getByText("P")).toBeInTheDocument();
  });

  it("flushes any pending debounce timers from PlayerSearch on unmount", async () => {
    // Defensive: PlayerSearch internally schedules a 300ms debounce
    // setTimeout. If it fires after the slot picker has unmounted, React
    // logs an act() warning. This test asserts unmount is silent.
    const { unmount } = renderSlot("A");

    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText(/search player a/i), "Sa");

    await act(async () => {
      unmount();
      // Give the debounce a moment to fire post-unmount (no-op when the
      // useEffect cleanup ran on unmount). No stderr act() warning should
      // appear in the test output.
      await new Promise((resolve) => setTimeout(resolve, 400));
    });
  });
});
