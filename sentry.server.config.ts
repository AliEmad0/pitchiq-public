// Sentry Node-runtime initialization. Imported once by
// `instrumentation.ts#register` when `NEXT_RUNTIME === "nodejs"`. Inert
// without a DSN configured.

import * as Sentry from "@sentry/nextjs";

import { sanitizeEvent } from "@/utils/sentry-sanitize";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  // Strip api-football's `x-apisports-key` header and any `?key=` query
  // strings from breadcrumbs before they leave the server. Same logic the
  // browser + edge configs use.
  beforeSend: sanitizeEvent,
});
