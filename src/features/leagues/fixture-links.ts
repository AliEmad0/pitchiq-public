import { normalizeName } from "@/utils/normalize-name";

/**
 * Build a name → id lookup from a set of entities (a season's squad, or its
 * managers). A normalized name that maps to TWO different ids is marked
 * ambiguous and resolves to null — we never link the wrong entity. Generic over
 * the id type so players (number) and managers (string) both work. ("M21")
 */
export function buildNameResolver<T extends string | number>(
  entries: Array<{ id: T; name: string }>,
): (name: string | null | undefined) => T | null {
  const map = new Map<string, T | null>(); // value null = ambiguous
  for (const e of entries) {
    const key = normalizeName(e.name);
    if (!key) continue;
    if (map.has(key)) {
      if (map.get(key) !== e.id) map.set(key, null);
    } else {
      map.set(key, e.id);
    }
  }
  return (name) => {
    if (!name) return null;
    return map.get(normalizeName(name)) ?? null;
  };
}
