// Auto-derived search acronym for a player name (TASK-M30): the first letter of
// each whitespace/hyphen-separated token, lowercased. So "Kevin De Bruyne" →
// "kdb", "Robin van Persie" → "rvp", "Trent Alexander-Arnold" → "taa". The
// /api/search route matches a 2-4 letter query against this so initials-style
// nicknames surface their player — covering every multi-word player for free,
// with nothing stored in the index.
export function nameAcronym(name: string): string {
  return name
    .toLowerCase()
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((token) => token[0])
    .join("");
}
