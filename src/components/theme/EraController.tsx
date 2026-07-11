"use client";

import { parseAsInteger, useQueryState } from "nuqs";
import { useEffect } from "react";

import { usePathname } from "@/i18n/navigation";
import { eraForSeason } from "@/utils/era";
import { currentDataSeason, seasonFromFixtureId } from "@/utils/season";

// TASK-M25: keeps `<html data-era>` in sync with the active season on
// client-side navigation (the season switcher writes ?season= without a full
// reload). The no-flash inline script in layout.tsx handles the FIRST paint;
// this handles every change after hydration. Renders nothing.
export function EraController() {
  const [season] = useQueryState("season", parseAsInteger);
  const pathname = usePathname();

  useEffect(() => {
    let year = season;
    if (year === null) {
      const m = pathname.match(/^\/fixtures\/(.+)$/);
      year = m ? seasonFromFixtureId(m[1]) : null;
    }
    if (year === null) year = currentDataSeason();

    const era = eraForSeason(year);
    const el = document.documentElement;
    if (era === "modern") delete el.dataset.era;
    else el.dataset.era = era;
  }, [season, pathname]);

  return null;
}
