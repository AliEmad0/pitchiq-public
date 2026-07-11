// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/leagues/fixtures.api", () => ({
  getNextFixtures: vi.fn(),
  getRecentResults: vi.fn(),
}));

import { getNextFixtures, getRecentResults } from "@/features/leagues/fixtures.api";

import { GET } from "@/app/api/fixtures/route";

const STUB_FIXTURE = [{ fixture: { id: 1 } }];

describe("GET /api/fixtures", () => {
  afterEach(() => {
    vi.mocked(getNextFixtures).mockReset();
    vi.mocked(getRecentResults).mockReset();
  });

  it("routes mode=next to getNextFixtures and returns 200 + JSON", async () => {
    vi.mocked(getNextFixtures).mockResolvedValue(STUB_FIXTURE as never);
    const res = await GET(new Request("http://localhost/api/fixtures?mode=next&season=2024"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(STUB_FIXTURE);
    expect(getNextFixtures).toHaveBeenCalledWith({ season: 2024, count: 5 });
  });

  it("routes mode=last to getRecentResults and returns 200 + JSON", async () => {
    vi.mocked(getRecentResults).mockResolvedValue(STUB_FIXTURE as never);
    const res = await GET(new Request("http://localhost/api/fixtures?mode=last&season=2024"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(STUB_FIXTURE);
    expect(getRecentResults).toHaveBeenCalledWith({ season: 2024, count: 5 });
  });

  it("respects a custom count argument", async () => {
    vi.mocked(getNextFixtures).mockResolvedValue(STUB_FIXTURE as never);
    await GET(new Request("http://localhost/api/fixtures?mode=next&season=2024&count=3"));
    expect(getNextFixtures).toHaveBeenCalledWith({ season: 2024, count: 3 });
  });

  it("returns 400 invalid_mode when mode is missing", async () => {
    const res = await GET(new Request("http://localhost/api/fixtures?season=2024"));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "invalid_mode" });
    expect(getNextFixtures).not.toHaveBeenCalled();
    expect(getRecentResults).not.toHaveBeenCalled();
  });

  it("returns 400 invalid_mode for an unrecognised value", async () => {
    const res = await GET(new Request("http://localhost/api/fixtures?mode=foo&season=2024"));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "invalid_mode" });
  });

  it("returns 502 when the fetcher returns null", async () => {
    vi.mocked(getNextFixtures).mockResolvedValue(null);
    const res = await GET(new Request("http://localhost/api/fixtures?mode=next&season=2024"));
    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: "fixtures_unavailable" });
  });
});
