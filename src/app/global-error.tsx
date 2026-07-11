"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

import { logger } from "@/utils/logger";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

// Next 15 root-level error boundary — catches errors thrown inside the
// root `app/layout.tsx`. Without this file, React render errors in the
// shell can't be sent to Sentry (the SDK explicitly warns at boot if
// it's missing). Replaces the default Next 15 fallback document so the
// shell renders `<html><body>` itself.
//
// Per Sentry's manual-setup docs, `Sentry.captureException(error)` runs
// once on mount; we also log via the project's `logger` so the structured
// `route.error` key surfaces in dev console output identical to
// `app/error.tsx` (the per-segment boundary that catches the more common
// in-tree error case).
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    Sentry.captureException(error);
    logger.error("route.global_error", {
      name: error.name,
      message: error.message,
      stack: error.stack,
      digest: error.digest,
    });
  }, [error]);

  // This boundary REPLACES the root layout, so globals.css / the theme tokens
  // aren't guaranteed to be applied — everything is inline-styled so the
  // last-resort fallback looks intentional on its own (TASK-1503).
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>
        <main
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            fontFamily:
              "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
            background: "#0c0a14",
            color: "#f4f2fa",
          }}
        >
          <div
            style={{
              maxWidth: "28rem",
              width: "100%",
              background: "#16131f",
              border: "1px solid #2a2440",
              borderLeft: "4px solid #c91dbb",
              borderRadius: "12px",
              padding: "1.5rem",
            }}
          >
            <span
              style={{
                display: "inline-block",
                fontSize: "12px",
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "#c91dbb",
                background: "#221d30",
                border: "1px solid #2a2440",
                borderRadius: "6px",
                padding: "4px 10px",
              }}
            >
              VAR · System error
            </span>
            <h1 style={{ margin: "1rem 0 0", fontSize: "18px", fontWeight: 600 }}>
              Something went wrong
            </h1>
            <p style={{ margin: "0.375rem 0 0", fontSize: "14px", color: "#a09bb0" }}>
              An unexpected error occurred at the application root. You can try again, or refresh
              the page.
            </p>
            <button
              type="button"
              onClick={reset}
              style={{
                marginTop: "1.25rem",
                cursor: "pointer",
                borderRadius: "8px",
                border: 0,
                background: "#c91dbb",
                color: "#ffffff",
                padding: "9px 16px",
                fontSize: "13px",
                fontWeight: 600,
                fontFamily: "inherit",
              }}
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
