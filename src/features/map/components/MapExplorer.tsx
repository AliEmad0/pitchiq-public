"use client";

import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";

import { currentDataSeason } from "@/utils/season";

import { activeSetForSeason, latestSeasonByClub } from "../map-data";
import { clubsForRegion } from "../region-data";
import { UK_MAP } from "../uk-map";
import { useMapSeason } from "../use-map-season";
import { ClubMarker, type MarkerClub } from "./ClubMarker";
import { RegionModal } from "./RegionModal";
import { SeasonSlider } from "./SeasonSlider";
import { UkMap } from "./UkMap";

// Client root for /map: the memoized GB map + the absolutely-positioned marker
// layer + the timeline slider/panel. Clicking a region opens its modal.
export function MapExplorer({
  clubs,
  activeBySeason,
  seasons, // ascending
  titlesByClub,
}: {
  clubs: MarkerClub[];
  activeBySeason: Record<number, number[]>;
  seasons: number[];
  titlesByClub: Record<number, number>;
}) {
  const t = useTranslations("map");
  const [seasonRaw, setSeason] = useMapSeason();
  const season = seasonRaw ?? currentDataSeason();
  const activeSet = useMemo(
    () => activeSetForSeason(activeBySeason, season),
    [activeBySeason, season],
  );
  const latestByClub = useMemo(() => latestSeasonByClub(activeBySeason), [activeBySeason]);
  const [regionId, setRegionId] = useState<string | null>(null);
  const onSelectRegion = useCallback((id: string) => setRegionId(id), []);
  const region = regionId ? (UK_MAP.regions.find((r) => r.id === regionId) ?? null) : null;

  // TASK-1515 (concept #30 "cinema letterbox"): the map itself is untouched —
  // just centred — between two sticky "letterbox" lines: a caption bar pinned
  // under the header, and the season slider pinned to the bottom of the viewport
  // so the control stays reachable while scrolling the tall map.
  return (
    <div className="flex flex-col">
      {/* Full-bleed letterbox lines: the bar background spans the whole page
          width while the caption/slider content stays aligned to the site's
          content column via `container-page`. */}
      <h1 className="bg-muted sticky top-14 z-30 border-y">
        <span className="container-page text-muted-foreground block py-2.5 text-xs font-medium tracking-[0.15em] uppercase sm:text-sm">
          {t("caption")}
        </span>
      </h1>

      <div className="container-page my-6">
        <div className="relative mx-auto aspect-[1000/1203] w-full max-w-[680px]">
          <UkMap onSelectRegion={onSelectRegion} />
          {/* pointer-events-none so clicks on empty land reach the region paths;
              each .club-marker re-enables pointer-events (globals.css). */}
          <div className="pointer-events-none absolute inset-0">
            {clubs.map((club) => {
              const active = activeSet.has(club.teamId);
              return (
                <ClubMarker
                  key={club.teamId}
                  club={club}
                  active={active}
                  season={season}
                  linkSeason={active ? season : (latestByClub[club.teamId] ?? season)}
                />
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-muted sticky bottom-0 z-30 border-y">
        <div className="container-page py-3">
          <SeasonSlider
            seasons={seasons}
            season={season}
            activeCount={activeSet.size}
            onSeason={(s) => void setSeason(s)}
          />
        </div>
      </div>

      <RegionModal
        region={region ? { id: region.id, name: region.name } : null}
        clubs={region ? clubsForRegion(clubs, region.id) : []}
        titlesByClub={titlesByClub}
        season={season}
        activeSet={activeSet}
        latestByClub={latestByClub}
        onClose={() => setRegionId(null)}
      />
    </div>
  );
}
