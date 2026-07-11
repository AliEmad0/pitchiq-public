"use client";

import { parseAsInteger, useQueryState } from "nuqs";

import { currentDataSeason } from "@/utils/season";

// URL-state hook for the active PL season — the `?season=YYYY` query param.
// Used by the header's <SeasonSwitcher> (TASK-111) and any other client
// component that needs to read or write the selection.
//
// Defaults:
// - Initial value: `currentDataSeason()` (the newest season with committed
//   data). TASK-702 switched this from `currentPLSeason()` — that returned the
//   in-progress calendar season (e.g. 2025) which has no committed JSON, so the
//   switcher showed "2025-26" while every Server Component fell back to 2024
//   data (`parseSeason(..., currentDataSeason())`). Aligning the default closes
//   that mismatch — switcher label and rendered data now always agree.
// - `shallow: false` — selecting a season triggers an RSC refetch of the
//   page's Server Components (standings, leaderboards, fixtures, team
//   stats). The whole point of TASK-111.
// - `history: "push"` — back-button navigates between seasons.
// - `clearOnDefault: true` — picking the current season drops `?season=`
//   from the URL so canonical links stay clean.
export function useSeason() {
  return useQueryState(
    "season",
    parseAsInteger.withDefault(currentDataSeason()).withOptions({
      shallow: false,
      history: "push",
      clearOnDefault: true,
    }),
  );
}
