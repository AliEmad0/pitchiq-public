import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { logger } from "@/utils/logger";

// Mock Sentry so we can assert on the forwarder without sending real
// events. The mock returns a spy `captureMessage` shared across tests; we
// clear its history in beforeEach so each `it` starts fresh.
vi.mock("@sentry/nextjs", () => ({
  captureMessage: vi.fn(),
}));

// Import after the mock so the logger picks up our stub.
const Sentry = await import("@sentry/nextjs");
const captureMessage = vi.mocked(Sentry.captureMessage);

describe("logger", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    captureMessage.mockClear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("emits info as structured JSON via console.log", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    logger.info("hello", { foo: 1 });
    expect(spy).toHaveBeenCalledOnce();
    const line = spy.mock.calls[0][0] as string;
    const parsed = JSON.parse(line);
    expect(parsed.level).toBe("info");
    expect(parsed.message).toBe("hello");
    expect(parsed.foo).toBe(1);
    expect(typeof parsed.timestamp).toBe("string");
  });

  it("routes errors to console.error", () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    logger.error("boom", { code: "X" });
    expect(errSpy).toHaveBeenCalledOnce();
    const parsed = JSON.parse(errSpy.mock.calls[0][0] as string);
    expect(parsed.level).toBe("error");
    expect(parsed.code).toBe("X");
  });

  // warn must go to console.warn (not console.error): Next 15's dev redbox
  // promotes every console.error to a blocking error overlay, which made
  // routine warnings (season fallbacks, free-tier plan rejections,
  // schema-drift invariants) flood the dev experience as red errors.
  it("routes warnings to console.warn (not console.error)", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    logger.warn("ratelimit", { remaining: 1 });
    expect(warnSpy).toHaveBeenCalledOnce();
    expect(errSpy).not.toHaveBeenCalled();
    const parsed = JSON.parse(warnSpy.mock.calls[0][0] as string);
    expect(parsed.level).toBe("warn");
    expect(parsed.remaining).toBe(1);
  });
});

// TASK-005 — Sentry forwarding. The console-output behavior above is the
// contract for local dev; these cases cover the production hook into
// Sentry. The forwarder is gated on `NODE_ENV === "production"` (with a
// `SENTRY_FORWARD_DEV=1` escape hatch for local verification) so dev
// sessions don't pollute the dashboard.
describe("logger → Sentry forwarder", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    captureMessage.mockClear();
    // Quiet the console so the structured JSON doesn't fill test output.
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("does NOT forward in the default test environment (NODE_ENV=test)", () => {
    logger.error("local-boom", { code: "X" });
    logger.warn("local-warn", { remaining: 1 });
    expect(captureMessage).not.toHaveBeenCalled();
  });

  it("forwards logger.error as Sentry severity 'error' with fields in `extra` (NODE_ENV=production)", () => {
    vi.stubEnv("NODE_ENV", "production");
    logger.error("ratelimit.exceeded", { upstream: 429, season: 2024 });
    expect(captureMessage).toHaveBeenCalledExactlyOnceWith("ratelimit.exceeded", {
      level: "error",
      extra: { upstream: 429, season: 2024 },
    });
  });

  it("forwards logger.warn as Sentry severity 'warning' (NODE_ENV=production)", () => {
    vi.stubEnv("NODE_ENV", "production");
    logger.warn("leaderboard.api_errors", { kind: "topscorers" });
    expect(captureMessage).toHaveBeenCalledExactlyOnceWith("leaderboard.api_errors", {
      level: "warning",
      extra: { kind: "topscorers" },
    });
  });

  it("does NOT forward logger.info or logger.debug (keeps Sentry volume sustainable)", () => {
    vi.stubEnv("NODE_ENV", "production");
    logger.info("uneventful");
    logger.debug("verbose");
    expect(captureMessage).not.toHaveBeenCalled();
  });

  it("respects the SENTRY_FORWARD_DEV=1 escape hatch for local verification", () => {
    // Keep NODE_ENV at its default test value; the override should still
    // promote the warn/error into a Sentry event.
    vi.stubEnv("SENTRY_FORWARD_DEV", "1");
    logger.error("dev-verify");
    expect(captureMessage).toHaveBeenCalledOnce();
    expect(captureMessage.mock.calls[0][0]).toBe("dev-verify");
  });
});
