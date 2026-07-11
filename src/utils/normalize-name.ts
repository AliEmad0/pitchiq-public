// Read-safe name normalizer for fixture-page link resolution ("M21"). The
// script-side normalizeName lives in fpl-enrich.ts which imports node:fs, so it
// can't be used in src/. Folds the common non-ASCII football letters first
// (NFD leaves ð/ø/ł intact), then lowercases → strips diacritics → keeps
// [a-z0-9 ]. Used to match a lineup/event name to the season squad/managers.
const SPECIAL: Record<string, string> = {
  ð: "d",
  Ð: "d",
  ø: "o",
  Ø: "o",
  ł: "l",
  Ł: "l",
  ı: "i",
  İ: "i",
  ß: "ss",
  æ: "ae",
  Æ: "ae",
  œ: "oe",
  Œ: "oe",
};

export function normalizeName(name: string): string {
  return name
    .replace(/[ðÐøØłŁıİßæÆœŒ]/g, (c) => SPECIAL[c] ?? c)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
