import type { SearchIndex } from "@/data/schemas";

import type { TriviaFact, TriviaValues } from "./types";

/**
 * TASK-1606 follow-up: localize the ENTITY-NAME string values baked into trivia
 * facts on `/ar`.
 *
 * The rules put entity names into a fact's `values` as bare Latin strings (they
 * have the id in `sources`, but the value is just the display name), so
 * `<TriviaCard>`'s `localizeFactValues` — which only formats numbers — left club
 * / player / manager names in Latin inside an otherwise-Arabic "هل تعلم؟"
 * sentence. This is the server-side seam that swaps those strings to Arabic.
 *
 * Source of truth = the committed cross-season search index, which already
 * carries every team / player / manager's `name` + `nameAr` in ONE file. We
 * build a Latin-name → Arabic-name map and replace matching string values;
 * anything not found (or already Arabic) passes through unchanged — so `/en` and
 * any un-mapped entity degrade gracefully to the Latin source form.
 */

/** Build a `Latin display name → Arabic display name` map from the search index. */
export function buildNameMap(index: SearchIndex): Map<string, string> {
  const map = new Map<string, string>();
  const add = (entries: { name: string; nameAr?: string }[] | undefined) => {
    for (const e of entries ?? []) {
      if (e.nameAr && e.nameAr !== e.name) map.set(e.name, e.nameAr);
    }
  };
  // Teams first so a (near-impossible) cross-type name clash prefers the club.
  add(index.teams);
  add(index.managers);
  add(index.players);
  return map;
}

// English list joiners used by the rules (`joinNames`: "A, B and C").
const LIST_SPLIT = /\s*,\s*|\s+and\s+/;

/**
 * Localize one string value. A whole-string match wins first (this protects
 * club names that themselves contain a separator, e.g. "Brighton & Hove
 * Albion"). Otherwise, if the string is an English-joined LIST of entities and
 * EVERY part is known, rejoin with the Arabic conjunction; else keep it Latin.
 */
export function localizeNameValue(value: string, map: Map<string, string>): string {
  const whole = map.get(value);
  if (whole) return whole;
  const parts = value.split(LIST_SPLIT).map((p) => p.trim());
  if (parts.length > 1 && parts.every((p) => map.has(p))) {
    const ar = parts.map((p) => map.get(p)!);
    // "A، B و C" — Arabic comma + wa-conjunction; flows RTL inside the message.
    return ar.length <= 1 ? (ar[0] ?? "") : `${ar.slice(0, -1).join("، ")} و${ar[ar.length - 1]}`;
  }
  return value;
}

/** Map every string value of a fact through `localizeNameValue` (numbers untouched). */
function localizeValues(values: TriviaValues | undefined, map: Map<string, string>) {
  if (!values) return values;
  const out: TriviaValues = {};
  for (const [k, v] of Object.entries(values)) {
    out[k] = typeof v === "string" ? localizeNameValue(v, map) : v;
  }
  return out;
}

/**
 * Add extra Latin→Arabic pairs to the name map. The search index only carries
 * each team's CANONICAL name ("Manchester United"), but fixture-derived facts
 * use SHORT forms ("Man United", "Leeds") + VENUE names ("Old Trafford") that
 * the index doesn't have — the caller resolves those by id (they're in the ar
 * teams/venues maps) and passes them here. Only adds a NEW key whose Arabic
 * differs from the Latin (so a canonical entry already in the map wins).
 */
export function addArNames(
  map: Map<string, string>,
  pairs: Array<readonly [string | null | undefined, string | null | undefined]>,
): void {
  for (const [latin, ar] of pairs) {
    if (latin && ar && ar !== latin && !map.has(latin)) map.set(latin, ar);
  }
}

/** Return the facts with their entity-name string values localized to Arabic. */
export function localizeFactNames(facts: TriviaFact[], map: Map<string, string>): TriviaFact[] {
  if (map.size === 0) return facts;
  return facts.map((f) => (f.values ? { ...f, values: localizeValues(f.values, map) } : f));
}
