import { afterEach, describe, expect, it, vi } from "vitest";

import { isSentryEnabled } from "@/utils/sentry-enabled";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("isSentryEnabled", () => {
  it("is enabled in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SENTRY_FORWARD_DEV", "");
    expect(isSentryEnabled()).toBe(true);
  });

  it("is disabled in development by default", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("SENTRY_FORWARD_DEV", "");
    expect(isSentryEnabled()).toBe(false);
  });

  it("can be opted into in development via SENTRY_FORWARD_DEV=1", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("SENTRY_FORWARD_DEV", "1");
    expect(isSentryEnabled()).toBe(true);
  });

  it("ignores SENTRY_FORWARD_DEV values other than '1'", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("SENTRY_FORWARD_DEV", "true");
    expect(isSentryEnabled()).toBe(false);
  });
});
