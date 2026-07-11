import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Meta } from "@/data/schemas";

// Mock the loaders module so the route's `loadMeta()` call resolves to
// whatever shape this test wants — no real fs access.
vi.mock("@/data/loaders", () => ({
  loadMeta: vi.fn(),
}));

import { loadMeta } from "@/data/loaders";

const META_FIXTURE: Meta = {
  lastRefresh: "2026-05-24T18:56:25.900Z",
  datasets: [
    {
      slug: "external-data-pipeline",
      downloadedAt: "2026-05-24T18:56:13.718Z",
    },
    {
      slug: "external-data-pipeline",
      downloadedAt: "2026-05-24T18:56:18.757Z",
    },
  ],
  seasons: [2024],
  rowCounts: {
    "2024": {
      standings: 20,
      teams: 20,
      players: 527,
      fixtures: 380,
      leaderboards: 40,
    },
  },
};

beforeEach(() => {
  vi.mocked(loadMeta).mockReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("GET /api/health", () => {
  it("returns status:'ok' + commit + uptime + data:{lastRefresh,datasets} + ts when loadMeta resolves", async () => {
    vi.mocked(loadMeta).mockResolvedValue(META_FIXTURE);

    const { GET } = await import("@/app/api/health/route");
    const res = await GET();

    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.status).toBe("ok");
    expect(body.commit).toBe("dev"); // VERCEL_GIT_COMMIT_SHA unset
    expect(typeof body.uptime).toBe("number");
    expect(typeof body.ts).toBe("string");
    expect(body.data).toEqual({
      lastRefresh: META_FIXTURE.lastRefresh,
      datasets: META_FIXTURE.datasets,
    });
    // rowCounts is intentionally omitted from the response shape.
    expect((body.data as Record<string, unknown>)?.rowCounts).toBeUndefined();
  });

  it("returns data:null when loadMeta returns null", async () => {
    vi.mocked(loadMeta).mockResolvedValue(null);

    const { GET } = await import("@/app/api/health/route");
    const body = (await (await GET()).json()) as Record<string, unknown>;

    expect(body.status).toBe("ok"); // app is still up
    expect(body.data).toBeNull();
  });

  it("surfaces VERCEL_GIT_COMMIT_SHA as `commit` when set", async () => {
    vi.stubEnv("VERCEL_GIT_COMMIT_SHA", "abc1234deadbeef");
    vi.mocked(loadMeta).mockResolvedValue(META_FIXTURE);

    const { GET } = await import("@/app/api/health/route");
    const body = (await (await GET()).json()) as Record<string, unknown>;

    expect(body.commit).toBe("abc1234deadbeef");
  });

  it("returns an ISO-8601 timestamp", async () => {
    vi.mocked(loadMeta).mockResolvedValue(META_FIXTURE);

    const { GET } = await import("@/app/api/health/route");
    const body = (await (await GET()).json()) as Record<string, unknown>;

    expect(typeof body.ts).toBe("string");
    // Parses cleanly back into a Date (avoids over-specifying the regex).
    expect(Number.isNaN(new Date(body.ts as string).getTime())).toBe(false);
  });
});
