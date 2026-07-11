// Europe/London-pinned date formatting helpers shared by the dashboard's
// FixturesRail, the match-detail FixtureHeader, and the team profile's
// RecentFormStrip. Pure `Intl.DateTimeFormat` — no date-fns / dayjs.
//
// London is the PL's home TZ; pinning gives a stable SSR-renderable
// output that doesn't depend on the visitor's locale. A future
// hydrate-and-relocalize pass can override per user preference.

import { isRtl } from "@/utils/format";

// `locale` (default "en-GB") localizes the weekday + month names AND the digits
// on `/ar` (e.g. "السبت، ١٦ أغسطس · ١٩:٠٠" — Eastern-Arabic numerals via
// `numberingSystem: "arab"`). The `,` / `·` assembly is kept identical so English
// output is byte-unchanged. Europe/London TZ is preserved regardless of locale.
function numeralSystem(locale: string): "arab" | "latn" {
  return isRtl(locale) ? "arab" : "latn";
}

function dateParts(iso: string, locale: string) {
  const d = new Date(iso);
  const parts = new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    numberingSystem: numeralSystem(locale),
    timeZone: "Europe/London",
  }).formatToParts(d);
  const weekday = parts.find((p) => p.type === "weekday")?.value ?? "";
  const day = parts.find((p) => p.type === "day")?.value ?? "";
  const month = parts.find((p) => p.type === "month")?.value ?? "";
  return { d, weekday, day, month };
}

// "Sat, 16 Aug · 19:00" — used by FixturesRail cards and FixtureHeader.
export function formatKickoff(iso: string, locale = "en-GB"): string {
  const { d, weekday, day, month } = dateParts(iso, locale);
  const time = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    numberingSystem: numeralSystem(locale),
    timeZone: "Europe/London",
  }).format(d);
  return `${weekday}, ${day} ${month} · ${time}`;
}

// "Sat 16 Aug" — RecentFormStrip's compact date column (no time, no comma).
export function formatShortDate(iso: string, locale = "en-GB"): string {
  const { weekday, day, month } = dateParts(iso, locale);
  return `${weekday} ${day} ${month}`;
}
