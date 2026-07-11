import type { Fixture } from "@/types/api";
import { isRtl } from "@/utils/format";

// TASK-M12 — group a season's fixtures into per-day buckets for the
// all-fixtures page (`/fixtures`). Pure + deterministic so it unit-tests
// without fs/network. Days are keyed by the **London** calendar date so the
// grouping matches the kickoff times rendered by <FixtureCard> (which formats
// in Europe/London); a late-night UTC kickoff rolls into the correct local day.

export type FixtureDayGroup = {
  /** London calendar date, `YYYY-MM-DD` — the stable group key. */
  key: string;
  /** Human heading derived from the key, e.g. "Saturday, 16 August 2025". */
  heading: string;
  fixtures: Fixture[];
};

const LONDON_DAY = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/London",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** London calendar date (`YYYY-MM-DD`) for an ISO kickoff timestamp. */
export function londonDayKey(iso: string): string {
  // en-CA renders these options as "2025-08-16".
  return LONDON_DAY.format(new Date(iso));
}

/**
 * Format a `YYYY-MM-DD` day key as a human heading. The key is already a
 * calendar date, so it's parsed + formatted in UTC to avoid any timezone shift
 * (London is UTC+0/+1, so UTC-midnight of the key never rolls to another day).
 *
 * `locale` (default "en-GB") localizes the weekday + month names AND the digits
 * on `/ar` (Eastern-Arabic numerals via `numberingSystem: "arab"`).
 */
export function formatMatchdayHeading(key: string, locale = "en-GB"): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    numberingSystem: isRtl(locale) ? "arab" : "latn",
  }).format(new Date(`${key}T00:00:00Z`));
}

/**
 * Bucket fixtures by their London calendar day. Days are ordered by `order`
 * (`"asc"` oldest-first, the default; `"desc"` newest-first — used by the
 * all-fixtures page so the most recent matchday is at the top). Order within a
 * day follows input order (callers pass fixtures pre-sorted by kickoff).
 * Returns `[]` for an empty input.
 */
export function groupFixturesByDay(
  fixtures: readonly Fixture[],
  opts: { order?: "asc" | "desc"; locale?: string } = {},
): FixtureDayGroup[] {
  const buckets = new Map<string, Fixture[]>();
  for (const fx of fixtures) {
    const key = londonDayKey(fx.fixture.date);
    const existing = buckets.get(key);
    if (existing) existing.push(fx);
    else buckets.set(key, [fx]);
  }
  const keys = [...buckets.keys()].sort();
  if (opts.order === "desc") keys.reverse();
  return keys.map((key) => ({
    key,
    heading: formatMatchdayHeading(key, opts.locale),
    fixtures: buckets.get(key)!,
  }));
}
