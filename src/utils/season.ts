import { bidiIsolate, isRtl, localizeDigits } from "@/utils/format";

// Premier League runs Aug–May. the wire's `season` query param is the
// start year — "2024" means the 2024-25 season.
//
// `now` is injectable so tests can pin a deterministic moment.
// The Premier League's first-ever season is 1992-93, now covered via the legacy
// PL stats API (TASK-1403). `parseSeason` clamps `?season=` to [EARLIEST_SEASON,
// currentDataSeason()]. Lowered 2010 → 1993 in TASK-802, then 1993 → 1992 in
// TASK-1403, so every PL season resolves instead of being clamped to current.
export const EARLIEST_SEASON = 1992;

/**
 * Latest season for which data is committed to `data/`.
 *
 * The app reads from static JSON snapshots. This is the read-side default
 * for every fetcher; it is a
 * *committed* constant rather than `currentPLSeason()` (which advances by
 * calendar each August) so the app never defaults to a season whose
 * `data/<entity>-<year>.json` files haven't shipped yet — that would make
 * fetchers return null and render an empty dashboard.
 *
 * **Update procedure when fresh data ships:** when the sync workflow
 * adds `data/<entity>-<year>.json` files for the next season, bump this
 * constant to that year. The sync script could later expose this via
 * `_meta.json` to eliminate the manual bump.
 *
 * As of TASK-1203 this is 2025 — the 2025-26 season is the live default. Its
 * standings/fixtures/teams (TASK-1201), players/leaderboards/photos (TASK-1202),
 * and birth-year-finalized ids (TASK-1204) are all committed, and its
 * qualification map (TASK-1203) is in place. `getAvailableSeasons` advertises
 * every committed season up to this ceiling.
 */
export const LATEST_DATA_SEASON = 2025;

export function currentDataSeason(): number {
  return LATEST_DATA_SEASON;
}

export function currentPLSeason(now: Date = new Date()): number {
  const year = now.getFullYear();
  // getMonth() is 0-indexed; August (>= 7) flips to the new season.
  return now.getMonth() >= 7 ? year : year - 1;
}

// Normalize a raw `searchParams.season` value. Returns the fallback when the
// input is missing, non-numeric, out of range, or in the future. We accept
// `string | string[] | undefined` because Next 15 typing for `searchParams`
// is permissive about duplicate query params.
export function parseSeason(raw: string | string[] | undefined, fallback: number): number {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === undefined) return fallback;
  const n = Number(value);
  if (!Number.isInteger(n)) return fallback;
  if (n < EARLIEST_SEASON || n > fallback) return fallback;
  return n;
}

// Descending list of selectable seasons for the TASK-111 season switcher,
// newest first. `now` is injectable so tests can pin the head of the list.
// Free-tier the wire historical depth varies — anything between the
// returned years and the current season will hit the season-fallback memo
// or render the empty state, but the dropdown still offers them so the UX
// is consistent across plan tiers.
export function getPLSeasons(now: Date = new Date()): number[] {
  const current = currentPLSeason(now);
  const seasons: number[] = [];
  for (let s = current; s >= EARLIEST_SEASON; s--) seasons.push(s);
  return seasons;
}

/**
 * Derive the PL season (start year) from a fixture id of the form
 * `"YYYY-MM-DD-HOME-AWAY"`. The PL runs Aug–May, so a match in Aug–Dec belongs
 * to that calendar year's season and one in Jan–Jul to the previous year's
 * (e.g. `2025-05-25-...` → 2024-25 → 2024). Returns `null` when the id doesn't
 * start with a parseable date, so callers can fall back to `currentDataSeason()`.
 *
 * Why: `/fixtures/[id]` has no `?season=` param; without this it would default to
 * the current season and 404 every fixture from any other season — hiding the
 * committed historical fixtures + lineups/events.
 */
export function seasonFromFixtureId(id: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})-/.exec(id);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  if (!Number.isInteger(year) || month < 1 || month > 12) return null;
  return month >= 8 ? year : year - 1;
}

// English: "2024" → "2024-25". The end-year is two digits so 2099 → "99" and
// 2100 → "00", matching the dashboard h1's format.
//
// `locale` (default "en") drives the numeral system. On `/ar` (owner request)
// the season reads as a FULL, spaced range — "٢٠٢٥ - ٢٠٢٦", both years in full
// with a space either side of the dash — in Eastern-Arabic digits. It flows
// naturally in RTL (NOT bidi-isolated) so an Arabic reader reads it year-first
// (the visual "٢٠٢٦ - ٢٠٢٥" reordering reads right-to-left as 2025 then 2026).
// Trivia rules call this with no locale (source-form English `fact.text`).
export function formatSeasonLabel(season: number, locale = "en"): string {
  if (isRtl(locale)) return localizeDigits(`${season} - ${season + 1}`, locale);
  const next = String(season + 1).slice(-2);
  return bidiIsolate(`${season}-${next}`, locale);
}

/**
 * Append `?season=<season>` to an internal entity href so navigation preserves
 * the viewing season (TASK-M09) — otherwise `/players|teams/[id]` default to the
 * current season and a historical entity lands on `<DataUnavailable>`. Pass the
 * season the link is being rendered under; `null`/`undefined` leaves the href
 * bare (target falls back to the current season). Respects an existing query
 * string (uses `&`).
 */
export function withSeason(href: string, season: number | null | undefined): string {
  if (season == null) return href;
  return `${href}${href.includes("?") ? "&" : "?"}season=${season}`;
}

/**
 * Four possible lifecycle states for a season's fixture set:
 *
 *  - `"in-progress"` — at least one fixture in the past AND at least one
 *    in the future. The dashboard renders both rails normally.
 *  - `"ended"`       — every fixture is in the past. The "Upcoming
 *    Fixtures" rail is permanently empty; consumers should render the
 *    `<SeasonEndedCard>` empty-state instead (TASK-608).
 *  - `"future"`      — every fixture is in the future (e.g. mid-July of
 *    a pre-season period). Recent Results would be empty in this case.
 *  - `"unknown"`     — no fixtures at all (loader returned `null` or the
 *    array was empty). Don't claim ended/future without evidence.
 *
 * **Pure function — `now` is injectable.** Caller provides the array of
 * ISO date strings (typically `fixtures.map(f => f.date)`). This
 * lets tests pin both inputs for determinism and keeps the helper free of
 * fs/network dependencies.
 *
 * Currently the committed default is a finished season, so this
 * helper resolves to `"ended"` in production today. Phase 7/8 add older
 * + newer seasons that exercise the other states.
 */
export type SeasonState = "in-progress" | "ended" | "future" | "unknown";

export function getSeasonState(
  fixtureDatesIso: readonly string[],
  now: Date = new Date(),
): SeasonState {
  if (fixtureDatesIso.length === 0) return "unknown";
  const nowIso = now.toISOString();
  const anyUpcoming = fixtureDatesIso.some((date) => date > nowIso);
  const anyPast = fixtureDatesIso.some((date) => date <= nowIso);
  if (anyUpcoming && anyPast) return "in-progress";
  if (anyPast) return "ended"; // anyPast && !anyUpcoming
  return "future"; // anyUpcoming && !anyPast (length > 0 guarantees one side)
}
