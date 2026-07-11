import "@testing-library/jest-dom/vitest";

import { afterAll, afterEach, beforeAll } from "vitest";

import { server } from "./msw/server";

// Start the MSW server before any test; reset request-level overrides between
// tests; close on teardown. Handlers come from tests/msw/handlers.ts which is
// the single source of truth for both Vitest and any future Playwright /
// browser-worker integration.
beforeAll(() => {
  server.listen({ onUnhandledRequest: "warn" });
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});
