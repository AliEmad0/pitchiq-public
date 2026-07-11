import { localizeDigits } from "@/utils/format";

/**
 * Human-readable "X ago" string for an ISO timestamp (TASK-M22, localized in
 * TASK-1605).
 *
 * Pure — `now` is injectable so it's deterministic in tests. Returns "" for an
 * unparseable date; clamps future timestamps to 0 (→ "now" / "الآن"). Coarse
 * buckets (seconds → years) are plenty for a daily-refresh freshness stamp.
 *
 * `locale` (default "en") drives `Intl.RelativeTimeFormat` with
 * `numeric: "auto"` (so `en` gets "yesterday"/"last week" and `ar` gets
 * "أمس"/"الأسبوع الماضي"). `RelativeTimeFormatOptions` has no `numberingSystem`
 * field, and `ar` emits Western digits (e.g. "قبل 6 أيام"), so we transliterate
 * the output to Eastern-Arabic numerals for RTL via `localizeDigits`.
 */
export function relativeTimeFromNow(iso: string, locale = "en", now: Date = new Date()): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  // Clamp future timestamps to 0 so a build-time-baked stamp never reads "in N".
  const seconds = Math.max(0, Math.floor((now.getTime() - then) / 1000));

  const [value, unit] = pickBucket(seconds);
  return localizeDigits(rtf.format(-value, unit), locale);
}

/** Largest coarse bucket that fits — `[value, Intl unit]`. */
function pickBucket(seconds: number): [number, Intl.RelativeTimeFormatUnit] {
  if (seconds < 60) return [seconds, "second"];
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return [minutes, "minute"];
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return [hours, "hour"];
  const days = Math.floor(hours / 24);
  if (days < 7) return [days, "day"];
  if (days < 30) return [Math.floor(days / 7), "week"];
  if (days < 365) return [Math.floor(days / 30), "month"];
  return [Math.floor(days / 365), "year"];
}
