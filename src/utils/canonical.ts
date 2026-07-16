import { currentDataSeason } from "./season";

/**
 * Build a page's self-referencing canonical path.
 *
 * Search Console reported "User-declared canonical: N/A" — Next emits no
 * canonical on its own, so every route passes its own path through here into
 * `alternates.canonical`. The value stays relative; `metadataBase` (set in
 * `[locale]/layout.tsx`) resolves it to an absolute URL.
 *
 * Two rules:
 *  - **Locale** — routing is `localePrefix: "as-needed"`, so English keeps
 *    un-prefixed URLs and Arabic lives under `/ar`.
 *  - **Season** — the bare path and `?season=<current>` render identical content,
 *    so the default season is dropped (otherwise self-referencing canonicals
 *    would themselves create a duplicate pair). A non-default season is kept so
 *    each historical season stays independently indexable.
 */
export function canonicalPath(locale: string, path: string, season?: number): string {
  const trimmed = path === "/" ? "" : path.replace(/\/+$/, "");
  const localized = locale === "ar" ? `/ar${trimmed}` : trimmed;
  const base = localized === "" ? "/" : localized;
  const query = season !== undefined && season !== currentDataSeason() ? `?season=${season}` : "";
  return `${base}${query}`;
}
