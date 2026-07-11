// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/players/api", () => ({
  searchPlayers: vi.fn(),
}));

import { searchPlayers } from "@/features/players/api";

import { GET } from "@/app/api/players/search/route";

const STUB_HITS = [
  {
    id: 1485,
    name: "Bruno Fernandes",
    team: {
      id: 33,
      name: "Manchester United",
      logo: "https://media.api-sports.io/football/teams/33.png",
    },
    photo: "https://media.api-sports.io/football/players/1485.png",
  },
];

describe("GET /api/players/search", () => {
  afterEach(() => {
    vi.mocked(searchPlayers).mockReset();
  });

  it("returns 400 q_too_short when q is shorter than 3 characters", async () => {
    const res = await GET(new Request("http://localhost/api/players/search?q=Sa"));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "q_too_short" });
    expect(searchPlayers).not.toHaveBeenCalled();
  });

  it("returns 400 q_too_short when q is missing entirely", async () => {
    const res = await GET(new Request("http://localhost/api/players/search"));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "q_too_short" });
  });

  it("treats whitespace-only q as too short (after trim)", async () => {
    // Without trim, a 3-char `q=   ` would slip past the length check and
    // burn quota on wire returning zero matches.
    const res = await GET(new Request("http://localhost/api/players/search?q=%20%20%20"));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "q_too_short" });
    expect(searchPlayers).not.toHaveBeenCalled();
  });

  it("returns 200 and the slim shape on a valid query", async () => {
    vi.mocked(searchPlayers).mockResolvedValue(STUB_HITS);

    const res = await GET(new Request("http://localhost/api/players/search?q=Saka&season=2024"));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(STUB_HITS);
    // Third arg is the `?locale=` value (undefined here → identity / Latin).
    expect(searchPlayers).toHaveBeenCalledWith("Saka", 2024, undefined);
  });

  it("returns 200 + [] for a query with zero hits (not 502)", async () => {
    vi.mocked(searchPlayers).mockResolvedValue([]);

    const res = await GET(new Request("http://localhost/api/players/search?q=Xqz&season=2024"));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  it("returns 502 search_unavailable when the fetcher returns null", async () => {
    vi.mocked(searchPlayers).mockResolvedValue(null);

    const res = await GET(new Request("http://localhost/api/players/search?q=Saka&season=2024"));

    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: "search_unavailable" });
  });

  it("defaults to the current year when season is omitted", async () => {
    vi.mocked(searchPlayers).mockResolvedValue([]);

    await GET(new Request("http://localhost/api/players/search?q=Saka"));

    const passedSeason = vi.mocked(searchPlayers).mock.calls[0]?.[1];
    expect(passedSeason).toBe(new Date().getFullYear());
  });

  it("trims surrounding whitespace before passing q downstream", async () => {
    // A real combobox can fire `?q=%20Saka%20` if the user pastes from a
    // copy. Trim avoids forcing the fetcher to handle leading-space junk.
    vi.mocked(searchPlayers).mockResolvedValue([]);

    await GET(new Request("http://localhost/api/players/search?q=%20Saka%20&season=2024"));

    expect(searchPlayers).toHaveBeenCalledWith("Saka", 2024, undefined);
  });

  it("forwards the ?locale= param to the fetcher (TASK-1606)", async () => {
    vi.mocked(searchPlayers).mockResolvedValue(STUB_HITS);

    await GET(new Request("http://localhost/api/players/search?q=Saka&season=2024&locale=ar"));

    expect(searchPlayers).toHaveBeenCalledWith("Saka", 2024, "ar");
  });
});
