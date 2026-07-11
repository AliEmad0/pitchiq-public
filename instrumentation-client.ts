// Sentry browser-bundle initialization. Next 15 looks for this file at
// the project root (the modern replacement for `sentry.client.config.ts`,
// which is deprecated under Turbopack — Sentry SDK 10 logs a warning
// otherwise). Inert when `NEXT_PUBLIC_SENTRY_DSN` is unset.

import * as Sentry from "@sentry/nextjs";

import { isSentryEnabled } from "@/utils/sentry-enabled";
import { sanitizeEvent } from "@/utils/sentry-sanitize";

// Required for Sentry navigation breadcrumbs in the App Router (Sentry
// SDK 10 reads this hook from instrumentation-client.ts).
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

// Skip init in dev (see src/utils/sentry-enabled.ts) — with `withSentryConfig`
// also disabled in dev, the `/monitoring` tunnel route doesn't exist, so an
// init here would just emit failing tunnel requests. On the client the flag
// resolves from NODE_ENV (SENTRY_FORWARD_DEV is server-only).
if (isSentryEnabled()) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    // Performance traces sampled at 10% — enough to spot regressions without
    // burning through the free tier's transaction quota on noisy traffic.
    tracesSampleRate: 0.1,
    // Send replays only on error sessions; off for normal sessions to keep
    // bundle size manageable on the client.
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0,
    // Strip the wire's `the auth header` header and any `?key=` query
    // strings from breadcrumbs before they leave the browser. See sentry-
    // sanitize.ts — same logic is reused by the server + edge configs so
    // there's exactly one definition of "what counts as sensitive".
    beforeSend: sanitizeEvent,
    beforeBreadcrumb(breadcrumb) {
      if (breadcrumb.category === "fetch" || breadcrumb.category === "xhr") {
        const data = breadcrumb.data as Record<string, unknown> | undefined;
        if (data && typeof data.url === "string") {
          // Drop query strings from outgoing-request breadcrumbs.
          const [path] = data.url.split("?");
          data.url = path;
        }
      }
      return breadcrumb;
    },
  });
}
