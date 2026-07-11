// Country display name from a flag-icons code (TASK-M49). Managers' nationality
// is stored as a flag-icons code (ISO-2 lowercased, or a `gb-eng`/`gb-sct`/
// `gb-wls`/`gb-nir` home-nation code from an override). We derive the display
// name at render time via Intl.DisplayNames so the committed bio map can stay
// lean (code only); an override may set an explicit `nationality` to override.

const HOME_NATIONS: Record<string, string> = {
  "gb-eng": "England",
  "gb-sct": "Scotland",
  "gb-wls": "Wales",
  "gb-nir": "Northern Ireland",
};

let display: Intl.DisplayNames | null = null;
function regionNames(): Intl.DisplayNames {
  display ??= new Intl.DisplayNames(["en"], { type: "region", fallback: "none" });
  return display;
}

/**
 * A country display name from a flag-icons code. Returns null on null/unknown so
 * callers can render an override name or just the flag.
 */
export function countryNameFromCode(code: string | null | undefined): string | null {
  if (!code) return null;
  if (HOME_NATIONS[code]) return HOME_NATIONS[code];
  if (!/^[a-z]{2}$/.test(code)) return null;
  try {
    const name = regionNames().of(code.toUpperCase());
    // `fallback: "none"` → undefined for an unassigned code; the reserved
    // "ZZ"/"XX" codes map to the CLDR "Unknown Region" sentinel (locale is
    // pinned to "en", so this string is deterministic) — treat both as null.
    return name && name !== "Unknown Region" ? name : null;
  } catch {
    return null;
  }
}
