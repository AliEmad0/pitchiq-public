// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/players/api", () => ({
  getPlayerSlim: vi.fn(),
}));

import { getPlayerSlim } from "@/features/players/api";

import { GET } from "@/app/api/players/[id]/route";

const STUB_HIT = {
  id: 1485,
  name: "Bruno Fernandes",
  team: {
    id: 33,
    name: "Manchester United",
    logo: "https://media.api-sports.io/football/teams/33.png",
  },
  photo: "https://media.api-sports.io/football/players/1485.png",
};

describe("GET /api/players/[id]", () => {
  afterEach(() => {
    vi.mocked(getPlayerSlim).mockReset();
  });

  it("returns 200 and the slim shape on a valid numeric id", async () => {
    vi.mocked(getPlayerSlim).mockResolvedValue(STUB_HIT);

    const res = await GET(new Request("http://localhost/api/players/1485?season=2024"), {
      params: Promise.resolve({ id: "1485" }),
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(STUB_HIT);
    // Third arg is the `?locale=` value (undefined here → identity / Latin).
    expect(getPlayerSlim).toHaveBeenCalledWith(1485, 2024, undefined);
  });

  it("forwards the ?locale= param to the fetcher (TASK-1606)", async () => {
    vi.mocked(getPlayerSlim).mockResolvedValue(STUB_HIT);

    await GET(new Request("http://localhost/api/players/1485?season=2024&locale=ar"), {
      params: Promise.resolve({ id: "1485" }),
    });

    expect(getPlayerSlim).toHaveBeenCalledWith(1485, 2024, "ar");
  });

  it("returns 400 invalid_id for non-numeric id", async () => {
    const res = await GET(new Request("http://localhost/api/players/abc"), {
      params: Promise.resolve({ id: "abc" }),
    });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "invalid_id" });
    expect(getPlayerSlim).not.toHaveBeenCalled();
  });

  it("returns 400 invalid_id for a non-finite id (e.g. NaN-after-parse)", async () => {
    // A URL like `/api/players/0` is valid as far as the route is
    // concerned (wire won't have a player 0, but the upstream
    // returns []  → 404). What we filter here is purely "did the
    // dynamic segment parse to a real number?".
    const res = await GET(new Request("http://localhost/api/players/Infinity"), {
      params: Promise.resolve({ id: "Infinity" }),
    });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "invalid_id" });
  });

  it("returns 404 not_found when the fetcher returns null", async () => {
    vi.mocked(getPlayerSlim).mockResolvedValue(null);

    const res = await GET(new Request("http://localhost/api/players/999999?season=2024"), {
      params: Promise.resolve({ id: "999999" }),
    });

    // 404 (not 502) because the most common cause of null here is an
    // unknown id — the slot picker treats that as "stale URL state"
    // and clears the slot. Genuine upstream failures (5xx) are bundled
    // into the same code path; if we ever need to distinguish, we'd
    // teach getPlayerSlim to return a discriminated union.
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "player_not_found" });
  });

  it("defaults to the current year when season is omitted", async () => {
    vi.mocked(getPlayerSlim).mockResolvedValue(STUB_HIT);

    await GET(new Request("http://localhost/api/players/1485"), {
      params: Promise.resolve({ id: "1485" }),
    });

    const passedSeason = vi.mocked(getPlayerSlim).mock.calls[0]?.[1];
    expect(passedSeason).toBe(new Date().getFullYear());
  });
});
