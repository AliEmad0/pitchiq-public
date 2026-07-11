import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
}));

import { revalidateTag } from "next/cache";

import { GET } from "@/app/api/admin/revalidate/route";

describe("GET /api/admin/revalidate", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.mocked(revalidateTag).mockClear();
  });

  it("returns 401 when REVALIDATE_SECRET is not configured on the server", async () => {
    vi.stubEnv("REVALIDATE_SECRET", "");
    const req = new Request(
      "http://localhost/api/admin/revalidate?tag=standings:39:2024&secret=anything",
    );
    const res = await GET(req);
    expect(res.status).toBe(401);
    expect(vi.mocked(revalidateTag)).not.toHaveBeenCalled();
  });

  it("returns 401 when the secret query param is missing", async () => {
    vi.stubEnv("REVALIDATE_SECRET", "correct");
    const req = new Request("http://localhost/api/admin/revalidate?tag=standings:39:2024");
    const res = await GET(req);
    expect(res.status).toBe(401);
    expect(vi.mocked(revalidateTag)).not.toHaveBeenCalled();
  });

  it("returns 401 when the secret query param is wrong", async () => {
    vi.stubEnv("REVALIDATE_SECRET", "correct");
    const req = new Request(
      "http://localhost/api/admin/revalidate?tag=standings:39:2024&secret=wrong",
    );
    const res = await GET(req);
    expect(res.status).toBe(401);
    expect(vi.mocked(revalidateTag)).not.toHaveBeenCalled();
  });

  it("returns 400 when the tag query param is missing", async () => {
    vi.stubEnv("REVALIDATE_SECRET", "correct");
    const req = new Request("http://localhost/api/admin/revalidate?secret=correct");
    const res = await GET(req);
    expect(res.status).toBe(400);
    expect(vi.mocked(revalidateTag)).not.toHaveBeenCalled();
  });

  it("returns 200 and calls revalidateTag on a valid request", async () => {
    vi.stubEnv("REVALIDATE_SECRET", "correct");
    const req = new Request(
      "http://localhost/api/admin/revalidate?tag=standings:39:2024&secret=correct",
    );
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(vi.mocked(revalidateTag)).toHaveBeenCalledOnce();
    expect(vi.mocked(revalidateTag)).toHaveBeenCalledWith("standings:39:2024");
    const body = (await res.json()) as { ok: boolean; tag: string };
    expect(body).toEqual({ ok: true, tag: "standings:39:2024" });
  });
});
