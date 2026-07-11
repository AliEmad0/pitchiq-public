import { bidiIsolate, isRtl, localizeDigits } from "@/utils/format";

/**
 * Full years between an ISO birth date and an ISO end date (e.g. today, or a
 * date of death). Returns null on a missing/unparseable birth date. Pure +
 * timezone-free (compares the Y/M/D triples directly).
 */
export function ageBetween(
  birthDate: string | null | undefined,
  end: string | null | undefined,
): number | null {
  if (!birthDate || !end) return null;
  const b = birthDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const e = end.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!b || !e) return null;
  const [by, bm, bd] = [Number(b[1]), Number(b[2]), Number(b[3])];
  const [ey, em, ed] = [Number(e[1]), Number(e[2]), Number(e[3])];
  let age = ey - by;
  // Not yet had this year's birthday by the end date → subtract one.
  if (em < bm || (em === bm && ed < bd)) age -= 1;
  return age < 0 ? null : age;
}

/** Today as an ISO "YYYY-MM-DD" string (local date). */
export function isoToday(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * A player's age "until now" — or frozen at their date of death if deceased
 * (TASK-M40). `now` is injectable for tests / SSR seeding.
 */
export function ageNow(
  birthDate: string | null | undefined,
  dateOfDeath: string | null | undefined,
  now: Date = new Date(),
): number | null {
  return ageBetween(birthDate, dateOfDeath ?? isoToday(now));
}

/**
 * Server-side seed age for SSR (TASK-M40): exact from full DOB when available,
 * else approximate from birth year (the M15 universal fallback). `<PlayerAge>`
 * refines a living player's value live on the client; deceased + year-only
 * players keep this seed. `now` injectable for tests.
 */
export function seedAge(
  birthDate: string | null | undefined,
  birthYear: number | null | undefined,
  dateOfDeath: string | null | undefined,
  now: Date = new Date(),
): number | null {
  if (birthDate) return ageNow(birthDate, dateOfDeath, now);
  if (birthYear != null) {
    const endYear = dateOfDeath ? Number(dateOfDeath.slice(0, 4)) : now.getFullYear();
    const age = endYear - birthYear;
    return age < 0 ? null : age;
  }
  return null;
}

/**
 * ISO "2000-10-25" → "25/10/2000" (UK date format); null on bad input.
 * `locale` (default "en") renders Eastern-Arabic numerals for RTL.
 *
 * ⚠️ RTL field order: a slash-separated numeric date resolves to a single
 * left-to-right number island under the Unicode bidi algorithm, so it always
 * displays in logical order. For an Arabic reader to read **day → month → year**
 * (right-to-left, day adjacent to the "ولد"/"تُوفّي" label) the string must be in
 * **YYYY/MM/DD** order — the island then shows year-on-the-left, day-on-the-right
 * (owner request). English keeps DD/MM/YYYY, bidi-isolated.
 */
export function formatBirthDate(iso: string | null | undefined, locale = "en"): string | null {
  if (!iso) return null;
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  if (isRtl(locale)) return localizeDigits(`${m[1]}/${m[2]}/${m[3]}`, locale);
  return bidiIsolate(`${m[3]}/${m[2]}/${m[1]}`, locale);
}
