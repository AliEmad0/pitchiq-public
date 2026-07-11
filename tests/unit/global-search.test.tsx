import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import en from "@/i18n/messages/en.json";

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: pushMock }) }));

import { GlobalSearch } from "@/components/layout/GlobalSearch";

const RESULTS = {
  teams: [{ id: 42, name: "Arsenal", logo: "/logos/42.png", season: 2025 }],
  players: [
    {
      id: 1927,
      name: "Bukayo Saka",
      team: { id: 42, name: "Arsenal", logo: "/logos/42.png" },
      photo: "https://example.test/saka.png",
      season: 2011, // a historical season → the link must carry ?season=2011 (TASK-M08)
    },
  ],
  managers: [
    {
      id: "lm-ossie-ardiles", // legacy-only manager → string slug id
      name: "Ossie Ardiles",
      photo: "",
      season: 1994,
    },
  ],
};

function jsonResponse<T>(body: T, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
    ...init,
  });
}

function renderWithQuery(ui: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      <QueryClientProvider client={client}>{ui}</QueryClientProvider>
    </NextIntlClientProvider>,
  );
}

describe("GlobalSearch", () => {
  beforeEach(() => {
    pushMock.mockClear();
    vi.spyOn(global, "fetch").mockImplementation(() => Promise.resolve(jsonResponse(RESULTS)));
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders the header search trigger", () => {
    renderWithQuery(<GlobalSearch />);
    expect(screen.getByRole("button", { name: /search/i })).toBeInTheDocument();
  });

  it("opens the palette via the ⌘K shortcut", async () => {
    renderWithQuery(<GlobalSearch />);
    fireEvent.keyDown(document, { key: "k", metaKey: true });
    expect(
      await screen.findByPlaceholderText(/search teams, players & managers/i),
    ).toBeInTheDocument();
  });

  it("shows Teams + Players sections for a query and navigates to a team on select", async () => {
    const user = userEvent.setup();
    renderWithQuery(<GlobalSearch />);

    await user.click(screen.getByRole("button", { name: /search/i }));
    await user.type(await screen.findByPlaceholderText(/search teams, players & managers/i), "ars");

    // The team row and Saka's team label both say "Arsenal" — target the rows
    // by their distinct accessible names (cmdk items are role="option").
    const teamOption = await screen.findByRole("option", { name: "Arsenal" });
    expect(teamOption).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /Bukayo Saka/ })).toBeInTheDocument();
    // Section headings
    expect(screen.getByText("Teams")).toBeInTheDocument();
    expect(screen.getByText("Players")).toBeInTheDocument();

    await user.click(teamOption);
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/teams/42?season=2025"));
  });

  it("navigates to the player page on selecting a player", async () => {
    const user = userEvent.setup();
    renderWithQuery(<GlobalSearch />);

    await user.click(screen.getByRole("button", { name: /search/i }));
    await user.type(
      await screen.findByPlaceholderText(/search teams, players & managers/i),
      "saka",
    );

    // Target by the option's accessible name — TASK-M31's highlight splits the
    // matched substring into its own span, so a single-element text match no
    // longer works (the aria-label keeps the accessible name intact).
    await user.click(await screen.findByRole("option", { name: /Bukayo Saka/ }));
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/players/1927?season=2011"));
  });

  it("shows a Managers section and navigates to the manager page (string lm- id)", async () => {
    const user = userEvent.setup();
    renderWithQuery(<GlobalSearch />);

    await user.click(screen.getByRole("button", { name: /search/i }));
    await user.type(
      await screen.findByPlaceholderText(/search teams, players & managers/i),
      "ardiles",
    );

    expect(await screen.findByText("Managers")).toBeInTheDocument();
    await user.click(await screen.findByRole("option", { name: /Ossie Ardiles/ }));
    await waitFor(() =>
      expect(pushMock).toHaveBeenCalledWith("/managers/lm-ossie-ardiles?season=1994"),
    );
  });
});
