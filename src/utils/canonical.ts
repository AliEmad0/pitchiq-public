import { currentDataSeason } from "./season";

/**
 * Build a page's self-referencing canonical path.
 *
 * Search Console reported "User-declared canonical: N/A" — Next emits no
 * canonical on its own, so every route passes its own path through here into
 * `alternates.canonical`. The value stays relative; `metadataBase` (set in
 * `[locale]/layout.tsx`) resolves it to an absolute URL.
 *
 * Three rules:
 *  - **Locale** — routing is `localePrefix: "as-needed"`, so English keeps
 *    un-prefixed URLs and Arabic lives under `/ar`.
 *  - **Season** — the bare path and `?season=<current>` render identical content,
 *    so the default season is dropped (otherwise self-referencing canonicals
 *    would themselves create a duplicate pair). A non-default season is kept so
 *    each historical season stays independently indexable.
 *  - **The home page never carries a season.** Two reasons, and the first is
 *    non-negotiable: Next CANNOT express a root-path canonical that has a query.
 *    `resolveAbsoluteUrlWithPathname` does
 *      `resolvedUrl = result.pathname === '/' ? result.origin : result.href`
 *    so anything resolving to pathname `/` is reduced to the bare origin and the
 *    query is silently dropped (an absolute string or a `URL` instance hits the
 *    same branch — there is no way around it). Rather than emit a canonical that
 *    lies, `/` is treated as one canonical entry point per locale; season-specific
 *    content stays indexable through the deep routes (/teams, /fixtures,
 *    /leaderboards, …), which are unaffected because their pathname isn't `/`.
 *    `/ar` follows the same rule so both locales behave identically (its pathname
 *    is `/ar`, so Next *would* keep a query there — the asymmetry would be worse
 *    than the omission).
 */
export function canonicalPath(locale: string, path: string, season?: number): string {
  const trimmed = path === "/" ? "" : path.replace(/\/+$/, "");
  const localized = locale === "ar" ? `/ar${trimmed}` : trimmed;
  const base = localized === "" ? "/" : localized;
  const isHome = trimmed === "";
  const keepSeason = !isHome && season !== undefined && season !== currentDataSeason();
  return `${base}${keepSeason ? `?season=${season}` : ""}`;
}
