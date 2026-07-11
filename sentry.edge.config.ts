// Sentry Edge-runtime initialization. Imported once by
// `instrumentation.ts#register` when `NEXT_RUNTIME === "edge"`. Inert
// without a DSN configured.

import * as Sentry from "@sentry/nextjs";

import { sanitizeEvent } from "@/utils/sentry-sanitize";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  beforeSend: sanitizeEvent,
});
