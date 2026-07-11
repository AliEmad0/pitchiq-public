import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/data/loaders", () => ({ findPlayerSeasons: vi.fn() }));

import { findPlayerSeasons } from "@/data/loaders";
import { GET } from "@/app/api/players/[id]/seasons/route";

function req() {
  return new Request("http://test/api/players/1003061/seasons");
}

beforeEach(() => vi.resetAllMocks());

describe("GET /api/players/[id]/seasons", () => {
  it("returns the player's seasons newest-first", async () => {
    vi.mocked(findPlayerSeasons).mockResolvedValue({
      name: "x",
      teamId: 3,
      latest: {} as never,
      seasons: [2006, 2003],
    });
    const res = await GET(req(), { params: Promise.resolve({ id: "1003061" }) });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ seasons: [2006, 2003] });
  });

  it("400 on a non-integer id", async () => {
    const res = await GET(req(), { params: Promise.resolve({ id: "abc" }) });
    expect(res.status).toBe(400);
  });

  it("404 on an unknown player", async () => {
    vi.mocked(findPlayerSeasons).mockResolvedValue(null);
    const res = await GET(req(), { params: Promise.resolve({ id: "999999" }) });
    expect(res.status).toBe(404);
  });
});
