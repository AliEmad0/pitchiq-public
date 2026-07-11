// TASK-1605 / Session-59 Arabic polish — locale-aware formatting primitives.
//
// Numeral convention (owner decision, supersedes the earlier Western-digit
// choice): Arabic (`ar`) renders **Eastern-Arabic numerals (٠١٢٣)** everywhere;
// English keeps Western (0123). RTL locales also get a Unicode bidi isolate
// around any run that mixes digits with punctuation (a "2025-26" season label, a
// "3-0" score) so it can't visually reorder inside Arabic text.
//
// Pure — locale is an explicit param (default English) so OG routes, trivia
// fact text, and existing tests are unaffected.

const RTL_LOCALES = ["ar"];

/** Whether a locale renders right-to-left (mirrors `[locale]/layout.tsx` `dir`). */
export function isRtl(locale: string): boolean {
  return RTL_LOCALES.some((l) => locale === l || locale.startsWith(`${l}-`));
}

const LRI = String.fromCodePoint(0x2066); // LEFT-TO-RIGHT ISOLATE
const PDI = String.fromCodePoint(0x2069); // POP DIRECTIONAL ISOLATE

// U+0660..U+0669 — Eastern-Arabic (Arabic-Indic) digits ٠-٩, keyed by 0-9.
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

/**
 * Wrap a run in a Unicode isolate so it renders left-to-right inside RTL text
 * (e.g. "2025-26" can't visually flip to "26-2025", a score can't shuffle its
 * dash). No-op for LTR locales, keeping `en` output plus OG routes and existing
 * test strings byte-clean.
 */
export function bidiIsolate(value: string, locale: string): string {
  return isRtl(locale) ? `${LRI}${value}${PDI}` : value;
}

/**
 * Transliterate the ASCII digits in a string to Eastern-Arabic numerals for RTL
 * locales (e.g. a score "3-0" → "٣-٠", "35 (2)" → "٣٥ (٢)"). No-op for LTR.
 * Use this for numbers built into strings by hand (scores, ranges, "x of y"),
 * the counterpart to `formatNumber` for values already going through `Intl`.
 */
export function localizeDigits(value: string | number, locale: string): string {
  const s = String(value);
  if (!isRtl(locale)) return s;
  return s.replace(/[0-9]/g, (d) => ARABIC_DIGITS[Number(d)]);
}

/** Grouped number in the locale's numeral system (Eastern-Arabic for RTL); bidi-isolated in RTL. */
export function formatNumber(value: number, locale = "en"): string {
  if (isRtl(locale)) {
    // Eastern-Arabic digits, but grouped with a Latin BASELINE comma rather than
    // the CLDR Arabic thousands separator (U+066C ٬), which renders as a high mark
    // that reads as floating above the number — owner wants the familiar bottom
    // comma (e.g. capacity ٣١,٧٥٠, not ٣١٬٧٥٠). Group with `en`, then transliterate.
    const grouped = new Intl.NumberFormat("en").format(value);
    return bidiIsolate(localizeDigits(grouped, locale), locale);
  }
  const formatted = new Intl.NumberFormat(locale, { numberingSystem: "latn" }).format(value);
  return bidiIsolate(formatted, locale);
}

// Arabic ordinal WORDS (masculine, definite) 1..22 — the top-flight has at most
// 22 clubs (1992-94). Used for league standings position (المركز الأول …). Beyond
// the table (shouldn't happen), falls back to the plain Eastern-Arabic number.
const ARABIC_ORDINALS = [
  "الأول",
  "الثاني",
  "الثالث",
  "الرابع",
  "الخامس",
  "السادس",
  "السابع",
  "الثامن",
  "التاسع",
  "العاشر",
  "الحادي عشر",
  "الثاني عشر",
  "الثالث عشر",
  "الرابع عشر",
  "الخامس عشر",
  "السادس عشر",
  "السابع عشر",
  "الثامن عشر",
  "التاسع عشر",
  "العشرون",
  "الحادي والعشرون",
  "الثاني والعشرون",
];

/**
 * Ordinal for a 1-based rank. English uses the numeric suffix form ("1st",
 * "2nd", "11th"); Arabic uses the ordinal WORD ("الأول", "الثاني", …) — Arabic
 * sports media names a league position by word, not "١st" (owner request).
 */
export function formatOrdinal(n: number, locale = "en"): string {
  if (isRtl(locale)) {
    return ARABIC_ORDINALS[n - 1] ?? localizeDigits(n, locale);
  }
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}
