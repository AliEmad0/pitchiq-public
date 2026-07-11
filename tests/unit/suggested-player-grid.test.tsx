import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import en from "@/i18n/messages/en.json";
import { SuggestedPlayerGrid } from "@/features/players/components/SuggestedPlayerGrid";
import type { SuggestedPlayers } from "@/features/players/api";
import { useComparisonSelection } from "@/hooks/useComparisonSelection";

vi.mock("@/hooks/useComparisonSelection");
const mockedHook = vi.mocked(useComparisonSelection);

const SALAH = {
  id: 1000334,
  name: "Mohamed Salah",
  team: { id: 40, name: "Liverpool", logo: "/logos/40.png" },
  photo: "118748",
};
const SAKA = {
  id: 1927,
  name: "Bukayo Saka",
  team: { id: 42, name: "Arsenal", logo: "/logos/42.png" },
  photo: "223340",
};

// Salah leads both boards; Saka only assists. Tests dedupe + both-badge merge.
const SUGGESTED: SuggestedPlayers = {
  topScorers: [{ ...SALAH, goals: 29 }],
  topAssists: [
    { ...SALAH, assists: 18 },
    { ...SAKA, assists: 11 },
  ],
};

function jsonResponse<T>(body: T): Response {
  return new Response(JSON.stringify(body), { headers: { "content-type": "application/json" } });
}

function renderWithQuery(ui: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      <QueryClientProvider client={client}>{ui}</QueryClientProvider>
    </NextIntlClientProvider>,
  );
}

function setSelection(slotA: number | null, slotB: number | null) {
  const setSlot = vi.fn();
  mockedHook.mockReturnValue({
    slotA,
    slotB,
    seasonA: null,
    seasonB: null,
    setSlot,
    setSlotSeason: vi.fn(),
    clear: vi.fn(),
  });
  return setSlot;
}

describe("SuggestedPlayerGrid", () => {
  beforeEach(() => {
    vi.spyOn(global, "fetch").mockImplementation(() => Promise.resolve(jsonResponse(SUGGESTED)));
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders deduped cards with stat badges when both slots are empty", async () => {
    setSelection(null, null);
    renderWithQuery(<SuggestedPlayerGrid season={2024} />);

    // Salah appears once (deduped) with BOTH a goals and an assists badge.
    expect(await screen.findByText("Mohamed Salah")).toBeInTheDocument();
    expect(screen.getByText("⚽ 29")).toBeInTheDocument();
    expect(screen.getByText("🎯 18")).toBeInTheDocument();
    expect(screen.getByText("Bukayo Saka")).toBeInTheDocument();
    // deduped → only one "Mohamed Salah" card
    expect(screen.getAllByText("Mohamed Salah")).toHaveLength(1);
  });

  it("fills slot A first when both are empty", async () => {
    const setSlot = setSelection(null, null);
    renderWithQuery(<SuggestedPlayerGrid season={2024} />);

    const card = await screen.findByRole("button", { name: /add mohamed salah/i });
    await userEvent.click(card);
    expect(setSlot).toHaveBeenCalledWith("A", 1000334);
  });

  it("fills slot B when A is already taken (and hides the taken player)", async () => {
    const setSlot = setSelection(1000334, null); // Salah already in A
    renderWithQuery(<SuggestedPlayerGrid season={2024} />);

    // Salah is filtered out; only Saka remains.
    const card = await screen.findByRole("button", { name: /add bukayo saka/i });
    expect(screen.queryByText("Mohamed Salah")).toBeNull();
    await userEvent.click(card);
    expect(setSlot).toHaveBeenCalledWith("B", 1927);
  });

  it("renders nothing once every suggestion is already picked", async () => {
    setSelection(1000334, 1927); // both suggested players taken
    renderWithQuery(<SuggestedPlayerGrid season={2024} />);

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    await waitFor(() => {
      expect(screen.queryByText("Suggested players")).toBeNull();
      expect(screen.queryByRole("button")).toBeNull();
    });
  });
});
