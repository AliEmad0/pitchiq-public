import { afterEach, describe, expect, it, vi } from "vitest";

import { getSiteUrl } from "@/utils/site-url";

describe("getSiteUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns the URL from NEXT_PUBLIC_SITE_URL when set", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com");
    vi.stubEnv("VERCEL_URL", "pitchiq.vercel.app");
    expect(getSiteUrl().toString()).toBe("https://example.com/");
  });

  it("falls back to https://${VERCEL_URL} when NEXT_PUBLIC_SITE_URL is absent", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_URL", "pitchiq-preview-abc.vercel.app");
    expect(getSiteUrl().toString()).toBe("https://pitchiq-preview-abc.vercel.app/");
  });

  it("falls back to http://localhost:3000 when no env is set", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_URL", "");
    expect(getSiteUrl().toString()).toBe("http://localhost:3000/");
  });

  it("throws TypeError when NEXT_PUBLIC_SITE_URL is malformed", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "not-a-url");
    expect(() => getSiteUrl()).toThrow(TypeError);
  });
});
