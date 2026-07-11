// Next.js auto-detects this file (no flag needed in 15+) and calls
// `register()` once at server boot. We use it for two things:
//
// 1. Opt-in the Node-side MSW server when running under Playwright —
//    `TEST_MSW=1 pnpm dev` makes the server intercept the wire
//    outbound calls so E2E tests don't depend on the upstream being
//    reachable or the daily quota having headroom.
// 2. Initialize Sentry on the Node + Edge runtimes (TASK-005). The
//    client-side init lives in `sentry.client.config.ts` and is wired in
//    by `withSentryConfig` in `next.config.ts`.
//
// `onUnhandledRequest: "bypass"` keeps everything Next does internally
// (RSC streams, image optimizer, source-map fetches) untouched — MSW only
// matches the patterns declared in `tests/msw/handlers.ts`.
//
// Lives at the project root (not `src/`) because Next 15 + Turbopack
// reliably discovers the root variant; the `src/` variant was loaded
// inconsistently in our setup.
//
// Sentry is loaded lazily and only when `isSentryEnabled()` — off in dev by
// default. Sentry SDK 10's OpenTelemetry instrumentation patches module
// loading at runtime (`Sentry.init` → require-in-the-middle), which is
// incompatible with Turbopack before Next 15.4.1 and intermittently 500s the
// dev server ("missing required error components"). Gating `init` here keeps
// that runtime patching out of `pnpm dev`. There's intentionally no static
// `@sentry/nextjs` import. (The compile-time `import-in-the-middle` "can't be
// external" warnings come from Next's default serverExternalPackages list and
// are harmless noise — unrelated to the crashes.) To exercise Sentry locally,
// run a production build (`pnpm build && pnpm start`) or set SENTRY_FORWARD_DEV=1.
import { isSentryEnabled } from "@/utils/sentry-enabled";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    if (process.env.TEST_MSW === "1") {
      const { server } = await import("./tests/msw/server");
      server.listen({ onUnhandledRequest: "bypass" });

      console.log("[instrumentation] MSW Node server listening");
    }
    if (isSentryEnabled()) await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge" && isSentryEnabled()) {
    await import("./sentry.edge.config");
  }
}

// Capture Next 15 server-side request errors (Route Handlers, RSC) and forward
// them to Sentry. Required for the AC "throwing in a Route Handler appears in
// Sentry within 30s". A no-op when Sentry is disabled (dev); the SDK is
// imported dynamically so it isn't pulled in when the guard is false.
export async function onRequestError(
  ...args: Parameters<typeof import("@sentry/nextjs").captureRequestError>
): Promise<void> {
  if (!isSentryEnabled()) return;
  const Sentry = await import("@sentry/nextjs");
  Sentry.captureRequestError(...args);
}
