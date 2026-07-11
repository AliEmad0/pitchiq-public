// Keep the first occurrence of each `id`, preserving order. Used by the
// compare search focus dropdown (TASK-M11) to merge the top-scorers +
// top-assists suggestion lists into one flat list without a player who
// leads both appearing twice.
export function dedupeById<T extends { id: number }>(items: T[]): T[] {
  const seen = new Set<number>();
  const out: T[] = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
  }
  return out;
}
