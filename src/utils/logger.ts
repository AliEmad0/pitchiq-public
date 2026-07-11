import * as Sentry from "@sentry/nextjs";

type LogLevel = "debug" | "info" | "warn" | "error";

type LogFields = Record<string, unknown>;

// Map our internal log levels onto Sentry's `SeverityLevel`. We only ever
// forward `warn` and `error`; `info`/`debug` stay console-only to keep the
// Sentry event volume sustainable on the free tier.
const SENTRY_SEVERITY: Record<"warn" | "error", "warning" | "error"> = {
  warn: "warning",
  error: "error",
};

// Gate Sentry forwarding to production by default so dev sessions don't
// pollute the dashboard. Override via `SENTRY_FORWARD_DEV=1` when locally
// verifying the integration (`pnpm dev` + curl a failing route + watch
// the Sentry Issues feed populate).
function shouldForwardToSentry(): boolean {
  if (process.env.SENTRY_FORWARD_DEV === "1") return true;
  return process.env.NODE_ENV === "production";
}

function emit(level: LogLevel, message: string, fields?: LogFields) {
  const payload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...fields,
  };
  const line = JSON.stringify(payload);
  // Route to the matching console channel so Next 15's dev redbox only fires
  // on real `error` calls. Warnings (season fallbacks, plan rejections,
  // schema-drift invariants) are still surfaced on stderr via `console.warn`,
  // but the dev overlay treats them as warnings instead of blocking errors.
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }

  // TASK-005: forward warn/error to Sentry. captureMessage is a no-op when
  // the SDK isn't initialized (no DSN configured), so it's safe to call
  // even when shouldForwardToSentry() flips to true in environments without
  // a DSN. We use `extra` for the structured fields so they appear in the
  // event's "Additional Data" panel — keeping `message` as the canonical
  // event title means Sentry's grouping still collapses recurring incidents
  // sensibly (e.g. every `leaderboard.api_errors` warn folds into one issue).
  if ((level === "warn" || level === "error") && shouldForwardToSentry()) {
    Sentry.captureMessage(message, {
      level: SENTRY_SEVERITY[level],
      extra: fields,
    });
  }
}

export const logger = {
  debug: (message: string, fields?: LogFields) => {
    if (process.env.NODE_ENV !== "production") emit("debug", message, fields);
  },
  info: (message: string, fields?: LogFields) => emit("info", message, fields),
  warn: (message: string, fields?: LogFields) => emit("warn", message, fields),
  error: (message: string, fields?: LogFields) => emit("error", message, fields),
};
