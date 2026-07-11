// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/players/leaderboards.api", () => ({
  getTopScorers: vi.fn(),
  getTopAssists: vi.fn(),
  getTopYellowCards: vi.fn(),
  getTopRedCards: vi.fn(),
}));

import {
  getTopAssists,
  getTopRedCards,
  getTopScorers,
  getTopYellowCards,
} from "@/features/players/leaderboards.api";

import { GET } from "@/app/api/leaderboards/[kind]/route";

const STUB_ENTRY = [{ player: { id: 1, name: "X" }, statistics: [] }];

describe("GET /api/leaderboards/[kind]", () => {
  afterEach(() => {
    vi.mocked(getTopScorers).mockReset();
    vi.mocked(getTopAssists).mockReset();
    vi.mocked(getTopYellowCards).mockReset();
    vi.mocked(getTopRedCards).mockReset();
  });

  it.each([
    ["scorers", getTopScorers] as const,
    ["assists", getTopAssists] as const,
    ["yellow-cards", getTopYellowCards] as const,
    ["red-cards", getTopRedCards] as const,
  ])("routes %s to the right fetcher and returns 200 + JSON", async (slug, fetcher) => {
    vi.mocked(fetcher).mockResolvedValue(STUB_ENTRY as never);
    const res = await GET(new Request(`http://localhost/api/leaderboards/${slug}?season=2024`), {
      params: Promise.resolve({ kind: slug }),
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(STUB_ENTRY);
    expect(fetcher).toHaveBeenCalledWith({ season: 2024 });
  });

  it("returns 400 invalid_kind for an unrecognised slug", async () => {
    const res = await GET(new Request("http://localhost/api/leaderboards/blue-cards?season=2024"), {
      params: Promise.resolve({ kind: "blue-cards" }),
    });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "invalid_kind" });
  });

  it("returns 502 when the fetcher returns null", async () => {
    vi.mocked(getTopScorers).mockResolvedValue(null);
    const res = await GET(new Request("http://localhost/api/leaderboards/scorers?season=2024"), {
      params: Promise.resolve({ kind: "scorers" }),
    });
    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: "leaderboard_unavailable" });
  });
});
