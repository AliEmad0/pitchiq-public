import type { ErrorEvent } from "@sentry/nextjs";

// Sentry `beforeSend` shared by the client / server / edge configs so the
// project has exactly one definition of "PII we never want to leak":
//
// - `request.query_string` is replaced with `[Filtered]` — Sentry's
//   default scrubber catches obvious keys like `password=` but not the
//   api-football `?key=` shape. Cheaper to nuke the whole query string
//   than to allowlist individual params.
// - `x-apisports-key` (api-football's auth header) is overwritten with
//   `[Filtered]` so it doesn't surface in the Request panel.
//
// Per the TASK-005 AC: "No PII or API key in any Sentry event".
export function sanitizeEvent(event: ErrorEvent): ErrorEvent | null {
  if (event.request?.query_string) {
    event.request.query_string = "[Filtered]";
  }
  const headers = event.request?.headers;
  if (headers) {
    for (const key of Object.keys(headers)) {
      if (key.toLowerCase() === "x-apisports-key") {
        headers[key] = "[Filtered]";
      }
    }
  }
  return event;
}
