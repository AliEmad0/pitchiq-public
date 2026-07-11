import { notFound } from "next/navigation";

// TASK-1601 — catch-all under the [locale] segment. With the route tree nested
// under [locale], an unmatched URL would otherwise render Next's bare built-in
// 404 (no root layout → no Header/Footer). This catch-all matches any unknown
// path within the locale and throws notFound(), so the localized
// `[locale]/not-found.tsx` renders inside `[locale]/layout.tsx` (the VAR panel +
// shell). Specific routes still win over this catch-all by Next's route
// specificity.
export default function CatchAllNotFound() {
  notFound();
}
