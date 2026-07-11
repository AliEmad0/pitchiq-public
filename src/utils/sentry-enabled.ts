/**
 * Whether the Sentry SDK should initialize in the current environment.
 *
 * **Off in development by default.** Sentry SDK 10's OpenTelemetry auto-
 * instrumentation (`import-in-the-middle` / `require-in-the-middle`) is not
 * compatible with Turbopack before Next 15.4.1 (we're on 15.1.11). Loading it
 * under `pnpm dev` floods the log with "Package … can't be external" warnings
 * and intermittently destabilizes the dev server — recompiles can leave it
 * returning 500 on every route with "missing required error components,
 * refreshing…". Production builds use webpack and are unaffected, so Sentry
 * stays fully enabled there.
 *
 * Opt back into Sentry for a dev session with `SENTRY_FORWARD_DEV=1` — the same
 * flag that opts the logger's Sentry forwarding into dev (see
 * `src/utils/logger.ts#shouldForwardToSentry`). Note the flag is server-only
 * (not `NEXT_PUBLIC_`), so on the browser this resolves purely from `NODE_ENV`.
 *
 * Keep in sync with the inline copy in `next.config.ts`, which runs outside the
 * bundler and can't import this module via the `@` alias.
 */
export function isSentryEnabled(): boolean {
  return process.env.NODE_ENV === "production" || process.env.SENTRY_FORWARD_DEV === "1";
}
