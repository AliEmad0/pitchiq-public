import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import en from "@/i18n/messages/en.json";
import { PlayerSearch } from "@/features/players/components/PlayerSearch";
import type { PlayerSearchHit, SuggestedPlayers } from "@/features/players/api";

const SAKA: PlayerSearchHit = {
  id: 1927,
  name: "Bukayo Saka",
  team: {
    id: 42,
    name: "Arsenal",
    logo: "https://media.example.test/football/teams/42.png",
  },
  photo: "https://media.example.test/football/players/1927.png",
};

const FERNANDES: PlayerSearchHit = {
  id: 1485,
  name: "Bruno Fernandes",
  team: {
    id: 33,
    name: "Manchester United",
    logo: "https://media.example.test/football/teams/33.png",
  },
  photo: "https://media.example.test/football/players/1485.png",
};

function jsonResponse<T>(body: T, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
    ...init,
  });
}

function renderWithQuery(ui: ReactNode) {
  // Per-test QueryClient with retries off so a 502 stub doesn't trigger
  // a TanStack Query retry storm during the test.
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      <QueryClientProvider client={client}>{ui}</QueryClientProvider>
    </NextIntlClientProvider>,
  );
}

describe("PlayerSearch", () => {
  beforeEach(() => {
    // A fresh Response per call — the suggested-on-focus fetch (TASK-604) and
    // the search fetch both read the body, and a Response body can only be
    // consumed once.
    vi.spyOn(global, "fetch").mockImplementation(() => Promise.resolve(jsonResponse([SAKA])));
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders an input with the placeholder", () => {
    renderWithQuery(<PlayerSearch onSelect={() => {}} />);
    expect(screen.getByPlaceholderText(/search players/i)).toBeInTheDocument();
  });

  it("does not fire a SEARCH request below the 3-char threshold", async () => {
    const user = userEvent.setup();
    renderWithQuery(<PlayerSearch onSelect={() => {}} />);

    await user.type(screen.getByPlaceholderText(/search players/i), "Sa");
    // Wait past the debounce window inside act() so the internal
    // `setDebounced` state update (which fires when the 300 ms timer
    // resolves with "Sa") doesn't trigger a React act-warning after the
    // test has already torn down.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 400));
    });
    // Focus fires a /suggested request (TASK-604); the search endpoint must
    // not be hit below the 3-char threshold.
    const searchCalls = vi
      .mocked(global.fetch)
      .mock.calls.filter((c) => String(c[0]).includes("/api/players/search"));
    expect(searchCalls).toHaveLength(0);
  });

  it("debounces — typing 4 chars fast triggers exactly 1 SEARCH request", async () => {
    const user = userEvent.setup();
    renderWithQuery(<PlayerSearch onSelect={() => {}} />);

    await user.type(screen.getByPlaceholderText(/search players/i), "Saka");

    const searchCalls = () =>
      vi
        .mocked(global.fetch)
        .mock.calls.filter((c) => String(c[0]).includes("/api/players/search"));
    await waitFor(() => expect(searchCalls()).toHaveLength(1), { timeout: 2000 });
    // Final value of the input is "Saka" — the URL must reflect that, not
    // an intermediate state like "Sak".
    expect(String(searchCalls()[0]?.[0])).toMatch(/q=Saka/);
  });

  it("calls onSelect with the picked player when an item is chosen", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    vi.mocked(global.fetch).mockImplementation(() =>
      Promise.resolve(jsonResponse([SAKA, FERNANDES])),
    );

    renderWithQuery(<PlayerSearch onSelect={onSelect} />);
    await user.type(screen.getByPlaceholderText(/search players/i), "Saka");

    // Wait for the Saka row to render — cmdk renders items with role="option".
    const sakaOption = await screen.findByRole(
      "option",
      { name: /Bukayo Saka/ },
      { timeout: 2000 },
    );
    await user.click(sakaOption);

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(SAKA);
  });

  it("renders the empty state when the server returns zero hits", async () => {
    vi.mocked(global.fetch).mockImplementation(() => Promise.resolve(jsonResponse([])));
    const user = userEvent.setup();

    renderWithQuery(<PlayerSearch onSelect={() => {}} />);
    await user.type(screen.getByPlaceholderText(/search players/i), "Xqz");

    await screen.findByText(/no players found/i, undefined, { timeout: 2000 });
  });

  it("renders the upstream-error state when the fetch responds 502", async () => {
    vi.mocked(global.fetch).mockImplementation(() =>
      Promise.resolve(jsonResponse({ error: "search_unavailable" }, { status: 502 })),
    );
    const user = userEvent.setup();

    renderWithQuery(<PlayerSearch onSelect={() => {}} />);
    await user.type(screen.getByPlaceholderText(/search players/i), "Saka");

    await screen.findByText(/search unavailable|couldn't reach search|try again/i, undefined, {
      timeout: 2000,
    });
  });

  it("forwards the optional `season` prop into the search query string", async () => {
    const user = userEvent.setup();
    renderWithQuery(<PlayerSearch onSelect={() => {}} season={2024} />);
    await user.type(screen.getByPlaceholderText(/search players/i), "Saka");

    await waitFor(() => {
      const searchCall = vi
        .mocked(global.fetch)
        .mock.calls.find((c) => String(c[0]).includes("/api/players/search"));
      expect(searchCall).toBeTruthy();
      expect(String(searchCall?.[0])).toMatch(/season=2024/);
    });
  });
});

describe("PlayerSearch — suggested mode (TASK-604)", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  function mockByEndpoint(suggested: SuggestedPlayers, search: PlayerSearchHit[] = []) {
    vi.spyOn(global, "fetch").mockImplementation((input) => {
      const url = String(input);
      if (url.includes("/api/players/suggested")) {
        return Promise.resolve(jsonResponse(suggested));
      }
      return Promise.resolve(jsonResponse(search));
    });
  }

  it("shows a single deduped suggestion list (no section headers) when focused (TASK-M11)", async () => {
    // Salah-style dual-leader: SAKA is in BOTH lists → must render once, and
    // there must be no "Top Scorers" / "Top Assists" sub-headers.
    mockByEndpoint({ topScorers: [SAKA], topAssists: [SAKA, FERNANDES] });
    const user = userEvent.setup();
    renderWithQuery(<PlayerSearch onSelect={() => {}} season={2024} />);

    await user.click(screen.getByPlaceholderText(/search players/i));

    expect(await screen.findByRole("option", { name: /Bukayo Saka/ })).toBeInTheDocument();
    expect(await screen.findByRole("option", { name: /Bruno Fernandes/ })).toBeInTheDocument();
    // Deduped — Saka appears exactly once despite leading both lists.
    expect(screen.getAllByRole("option", { name: /Bukayo Saka/ })).toHaveLength(1);
    // No section sub-headers.
    expect(screen.queryByText("Top Scorers")).toBeNull();
    expect(screen.queryByText("Top Assists")).toBeNull();
    const suggestedCall = vi
      .mocked(global.fetch)
      .mock.calls.find((c) => String(c[0]).includes("/api/players/suggested"));
    expect(String(suggestedCall?.[0])).toMatch(/season=2024/);
  });

  it("calls onSelect when a suggested player is chosen", async () => {
    mockByEndpoint({ topScorers: [SAKA], topAssists: [] });
    const onSelect = vi.fn();
    const user = userEvent.setup();
    renderWithQuery(<PlayerSearch onSelect={onSelect} season={2024} />);

    await user.click(screen.getByPlaceholderText(/search players/i));
    const option = await screen.findByRole("option", { name: /Bukayo Saka/ }, { timeout: 2000 });
    await user.click(option);

    expect(onSelect).toHaveBeenCalledWith(SAKA);
  });

  it("switches to search at 3+ chars and back to suggestions when cleared", async () => {
    mockByEndpoint({ topScorers: [SAKA], topAssists: [] }, [FERNANDES]);
    const user = userEvent.setup();
    renderWithQuery(<PlayerSearch onSelect={() => {}} season={2024} />);
    const input = screen.getByPlaceholderText(/search players/i);

    await user.click(input);
    await screen.findByRole("option", { name: /Bukayo Saka/ }); // suggested mode

    await user.type(input, "Bru");
    await screen.findByRole("option", { name: /Bruno Fernandes/ }, { timeout: 2000 }); // search mode
    expect(screen.queryByRole("option", { name: /Bukayo Saka/ })).toBeNull();

    await user.clear(input);
    await screen.findByRole("option", { name: /Bukayo Saka/ }, { timeout: 2000 }); // suggested again
  });

  it("queries the cross-season index and maps players when crossSeason is set (TASK-M11)", async () => {
    const HENRY: PlayerSearchHit = {
      id: 1003061,
      name: "Thierry Henry",
      team: { id: 3, name: "Arsenal", logo: "/logos/3.png" },
      photo: "1619",
      season: 2011,
    };
    vi.spyOn(global, "fetch").mockImplementation((input) => {
      const url = String(input);
      if (url.includes("/api/search?q=")) {
        return Promise.resolve(jsonResponse({ teams: [], players: [HENRY] }));
      }
      return Promise.resolve(jsonResponse([]));
    });
    const onSelect = vi.fn();
    const user = userEvent.setup();
    renderWithQuery(<PlayerSearch crossSeason onSelect={onSelect} />);

    await user.type(screen.getByPlaceholderText(/search players/i), "Henry");
    const opt = await screen.findByRole("option", { name: /Thierry Henry/ }, { timeout: 2000 });

    // Hit the cross-season endpoint, not the season-scoped one.
    const calledCross = vi
      .mocked(global.fetch)
      .mock.calls.some((c) => String(c[0]).includes("/api/search?q="));
    expect(calledCross).toBe(true);

    await user.click(opt);
    // onSelect carries the hit incl. its latest season (so the slot resolves).
    expect(onSelect).toHaveBeenCalledWith(HENRY);
  });
});
