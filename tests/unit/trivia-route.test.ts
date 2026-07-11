/**
 * Tests for `GET /api/trivia` (TASK-1102). Reads the committed snapshots via the
 * server-only engine seam (server-only is stubbed in tests), so it asserts
 * against real 2025-26 data, which always produces league facts.
 */
import { describe, expect, it } from "vitest";

import { GET } from "@/app/api/trivia/route";

function request(qs = ""): Request {
  return new Request(`http://localhost/api/trivia${qs}`);
}

describe("GET /api/trivia", () => {
  it("returns league facts for ?scope=league", async () => {
    const res = await GET(request("?scope=league&season=2025"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.facts)).toBe(true);
    expect(body.facts.length).toBeGreaterThan(0);
    expect(body.facts[0]).toHaveProperty("text");
    expect(body.facts[0]).toHaveProperty("rule");
  });

  it("defaults to league scope + the latest season when params are absent", async () => {
    const res = await GET(request());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.facts.length).toBeGreaterThan(0);
  });

  it("400s on an unknown scope", async () => {
    const res = await GET(request("?scope=galaxy"));
    expect(res.status).toBe(400);
  });

  it("400s when a team/player scope is missing its id", async () => {
    expect((await GET(request("?scope=team"))).status).toBe(400);
    expect((await GET(request("?scope=player"))).status).toBe(400);
  });

  it("200s with an array for a team scope + id", async () => {
    const res = await GET(request("?scope=team&id=42&season=2025"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.facts)).toBe(true);
  });
});
