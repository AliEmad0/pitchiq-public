// Split a name into matched / unmatched segments against a query (TASK-M31) so
// the search dropdown can bold the matched characters. Case-insensitive,
// highlights every occurrence, and escapes regex-special chars so a query like
// "o'b" or "(x)" never throws. Returns the whole name as one unmatched segment
// when the query is empty or doesn't occur — the concatenated text always
// equals the original name, so the accessible option name is preserved.
export type HighlightSegment = { text: string; match: boolean };

export function highlightMatch(name: string, query: string): HighlightSegment[] {
  const q = query.trim();
  if (q === "") return [{ text: name, match: false }];

  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(${escaped})`, "ig");
  const ql = q.toLowerCase();

  return name
    .split(re)
    .filter((part) => part !== "")
    .map((part) => ({ text: part, match: part.toLowerCase() === ql }));
}
