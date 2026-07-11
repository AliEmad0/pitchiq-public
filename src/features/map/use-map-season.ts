"use client";

import { parseAsInteger, useQueryState } from "nuqs";

import { currentDataSeason } from "@/utils/season";

// Slider-friendly season state for /map (TASK-M27). Unlike `useSeason`
// (shallow:false → RSC refetch), this is `shallow:true`: the page already holds
// every season's data in props, so a slider drag only needs a client-side URL
// update (instant, no refetch). Writing `?season=` still drives <EraController>'s
// per-era re-skin. `history:"replace"` so dragging isn't 34 back-button stops.
export function useMapSeason() {
  return useQueryState(
    "season",
    parseAsInteger.withDefault(currentDataSeason()).withOptions({
      shallow: true,
      history: "replace",
      clearOnDefault: true,
    }),
  );
}
