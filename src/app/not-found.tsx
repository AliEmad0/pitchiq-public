import type { Metadata } from "next";
import Link from "next/link";

// TASK-1601 — root not-found for requests that don't match the `[locale]`
// segment at all (e.g. a malformed locale the middleware couldn't resolve).
// Renders its own minimal <html> because it sits OUTSIDE `[locale]/layout.tsx`.
// Localized 404s (unknown paths within a locale) are handled by the catch-all
// `app/[locale]/[...rest]/page.tsx` → `app/[locale]/not-found.tsx`, which keeps
// the full Header/Footer shell.
export const metadata: Metadata = { title: "Page not found — PitchIQ" };

export default function RootNotFound() {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#0c0a14",
          color: "#fafafa",
        }}
      >
        <main style={{ textAlign: "center", padding: "2rem" }}>
          <h1 style={{ fontSize: "1.5rem", margin: "0 0 0.5rem" }}>Page not found</h1>
          <p style={{ color: "#a1a1aa", margin: "0 0 1.5rem" }}>
            That page doesn’t exist. Head back to PitchIQ.
          </p>
          <Link href="/" style={{ color: "#c91dbb", fontWeight: 600 }}>
            Go home
          </Link>
        </main>
      </body>
    </html>
  );
}
