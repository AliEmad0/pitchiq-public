import type { ErrorEvent } from "@sentry/nextjs";

// Sentry `beforeSend` shared by the client / server / edge configs so the
// project has exactly one definition of "PII we never want to leak":
//
// - `request.query_string` is replaced with `[Filtered]` — Sentry's
//   default scrubber catches obvious keys like `password=` but not every
//   `?key=` shape. Cheaper to nuke the whole query string than to
//   allowlist individual params.
// - Any auth/API-key request header is overwritten with `[Filtered]` so
//   it doesn't surface in the Request panel.
//
// Per the TASK-005 AC: "No PII or API key in any Sentry event".
export function sanitizeEvent(event: ErrorEvent): ErrorEvent | null {
  if (event.request?.query_string) {
    event.request.query_string = "[Filtered]";
  }
  const headers = event.request?.headers;
  if (headers) {
    for (const key of Object.keys(headers)) {
      const lower = key.toLowerCase();
      if (lower === "authorization" || lower.endsWith("-key") || lower.endsWith("-token")) {
        headers[key] = "[Filtered]";
      }
    }
  }
  return event;
}
