import "server-only";

import { getLocale } from "next-intl/server";

import {
  loadArTeamNames,
  loadArPlayerNames,
  loadArManagerNames,
  loadArVenueNames,
  loadArCityNames,
  loadArRefereeNames,
  loadArPositionNames,
  loadArNationalityOverrides,
} from "@/data/loaders";
import type { ArNameMap } from "@/data/schemas";
import { normalizeName } from "@/utils/normalize-name";

/**
 * TASK-1606 — locale-aware entity-name resolution.
 *
 * On `/ar` the feature-api fetchers swap each entity's display name to its
 * Arabic form (from the committed `data/i18n/names-ar/*` maps), falling back to
 * the Latin source name wherever no Arabic value exists. On `/en` every method
 * is the identity of its Latin argument, so English output is byte-unchanged.
 */

export type ArMaps = {
  teams: ArNameMap;
  players: ArNameMap;
  managers: ArNameMap;
  venues: ArNameMap;
  cities: ArNameMap;
  referees: ArNameMap;
  positions: ArNameMap;
  nationalities: ArNameMap;
};

export type EntityNames = {
  isAr: boolean;
  team(id: number | string, latin: string): string;
  player(id: number | string, latin: string): string;
  manager(id: number | string, latin: string): string;
  venue(teamId: number | string, latin: string | null): string | null;
  city(teamId: number | string, latin: string | null): string | null;
  referee(latin: string | null): string | null;
  position(latin: string | null): string | null;
  nationality(code: string | null, latin: string | null): string | null;
};

/** The `/en` (and any non-Arabic locale) resolver — pure Latin passthrough. */
export const IDENTITY_NAMES: EntityNames = {
  isAr: false,
  team: (_id, latin) => latin,
  player: (_id, latin) => latin,
  manager: (_id, latin) => latin,
  venue: (_id, latin) => latin,
  city: (_id, latin) => latin,
  referee: (latin) => latin,
  position: (latin) => latin,
  nationality: (_code, latin) => latin,
};

/**
 * Arabic country name from an ISO code. A committed override wins (home nations
 * `gb-eng`… + any oddity); otherwise `Intl.DisplayNames('ar')` on the alpha-2
 * root; falls back to the Latin name if the runtime can't resolve it.
 */
function arCountry(code: string | null, latin: string | null, overrides: ArNameMap): string | null {
  if (!code) return latin;
  const override = overrides[code] ?? overrides[code.toLowerCase()];
  if (override) return override;
  const alpha2 = code.split("-")[0].toUpperCase();
  try {
    const out = new Intl.DisplayNames(["ar"], { type: "region" }).of(alpha2);
    return out ?? latin;
  } catch {
    return latin;
  }
}

/** Pure resolver factory — testable without a request context. */
export function makeEntityNames(maps: ArMaps, locale: string): EntityNames {
  if (!locale.startsWith("ar")) return IDENTITY_NAMES;
  const byId = (m: ArNameMap, id: number | string, latin: string) => m[String(id)] ?? latin;
  return {
    isAr: true,
    team: (id, latin) => byId(maps.teams, id, latin),
    player: (id, latin) => byId(maps.players, id, latin),
    manager: (id, latin) => byId(maps.managers, id, latin),
    venue: (id, latin) => (latin == null ? latin : (maps.venues[String(id)] ?? latin)),
    city: (id, latin) => (latin == null ? latin : (maps.cities[String(id)] ?? latin)),
    referee: (latin) => (latin == null ? latin : (maps.referees[normalizeName(latin)] ?? latin)),
    position: (latin) => (latin == null ? latin : (maps.positions[latin] ?? latin)),
    nationality: (code, latin) => arCountry(code, latin, maps.nationalities),
  };
}

/**
 * Read the active locale (next-intl) + the committed maps, and build the
 * resolver. Short-circuits to `IDENTITY_NAMES` on `/en` (no file reads).
 *
 * `localeOverride` lets a non-RSC caller (an `/api/*` Route Handler, which has
 * no `[locale]` segment so `getLocale()` can't resolve) pass the locale
 * explicitly from a `?locale=` query param — the same mechanism `/api/search`
 * uses. Omitted → read the request context (the normal page/RSC path).
 */
export async function getEntityNames(localeOverride?: string): Promise<EntityNames> {
  let locale: string;
  if (localeOverride !== undefined) {
    locale = localeOverride;
  } else {
    try {
      locale = await getLocale();
    } catch {
      // No next-intl request context (e.g. unit tests, or a non-RSC caller) →
      // behave as English so callers still return their Latin source names.
      return IDENTITY_NAMES;
    }
  }
  if (!locale.startsWith("ar")) return IDENTITY_NAMES;
  const [teams, players, managers, venues, cities, referees, positions, nationalities] =
    await Promise.all([
      loadArTeamNames(),
      loadArPlayerNames(),
      loadArManagerNames(),
      loadArVenueNames(),
      loadArCityNames(),
      loadArRefereeNames(),
      loadArPositionNames(),
      loadArNationalityOverrides(),
    ]);
  return makeEntityNames(
    {
      teams: teams ?? {},
      players: players ?? {},
      managers: managers ?? {},
      venues: venues ?? {},
      cities: cities ?? {},
      referees: referees ?? {},
      positions: positions ?? {},
      nationalities: nationalities ?? {},
    },
    locale,
  );
}
