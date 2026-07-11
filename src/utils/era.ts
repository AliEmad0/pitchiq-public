// Time-Machine Mode (TASK-M25): map a PL season (start year) to a visual era.
// Boundaries: retro 90s = 1992/93–1999/00 (≤1999); golden millennium =
// 2000/01–2009/10 (2000–2009); modern = 2010/11–present (≥2010).
//
// ⚠️ These thresholds are duplicated literally in the no-flash inline script in
// `src/app/layout.tsx` (an inline <script> can't import). Keep them in sync —
// this file's tests document the canonical values.
export type Era = "retro90s" | "goldenMillennium" | "modern";

export function eraForSeason(year: number): Era {
  if (year <= 1999) return "retro90s";
  if (year <= 2009) return "goldenMillennium";
  return "modern";
}
