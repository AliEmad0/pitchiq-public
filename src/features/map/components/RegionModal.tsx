"use client";

import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/navigation";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { clubLogo } from "@/utils/club-logo";
import { localizeDigits } from "@/utils/format";
import { formatSeasonLabel, withSeason } from "@/utils/season";

import type { MarkerClub } from "./ClubMarker";

// NUTS1 region id → `map` message key so the modal title reads Arabic on `/ar`
// (the region name is otherwise source-form English). English values equal the
// UK_MAP names, so `/en` is unchanged.
const REGION_KEY: Record<string, string> = {
  UKC: "regionNorthEast",
  UKD: "regionNorthWest",
  UKE: "regionYorkshire",
  UKF: "regionEastMidlands",
  UKG: "regionWestMidlands",
  UKH: "regionEastOfEngland",
  UKI: "regionLondon",
  UKJ: "regionSouthEast",
  UKK: "regionSouthWest",
  UKL: "regionWales",
};

// Region modal for /map (TASK-M27 follow-up): the region's clubs (active/dim for
// the season) + combined PL titles. Controlled by <MapExplorer>; renders null
// when no region is selected. Uses the shared Radix Dialog (era-skins for free).
export function RegionModal({
  region,
  clubs,
  titlesByClub,
  season,
  activeSet,
  latestByClub,
  onClose,
}: {
  region: { id: string; name: string } | null;
  clubs: MarkerClub[];
  titlesByClub: Record<number, number>;
  season: number;
  activeSet: Set<number>;
  latestByClub: Record<number, number>;
  onClose: () => void;
}) {
  const tm = useTranslations("map");
  const locale = useLocale();
  if (!region) return null;
  const titles = clubs.reduce((sum, c) => sum + (titlesByClub[c.teamId] ?? 0), 0);
  const activeCount = clubs.filter((c) => activeSet.has(c.teamId)).length;
  const sorted = [...clubs].sort(
    (a, b) =>
      (titlesByClub[b.teamId] ?? 0) - (titlesByClub[a.teamId] ?? 0) ||
      Number(activeSet.has(b.teamId)) - Number(activeSet.has(a.teamId)) ||
      a.name.localeCompare(b.name),
  );

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogTitle>
          <span className="text-primary block text-xs font-medium tracking-widest">
            {tm("regionEyebrow")}
          </span>
          {/* mt-1.5 gives the region name room below the eyebrow (owner: it read
              cramped against the heading). */}
          <span className="mt-1.5 block">
            {REGION_KEY[region.id] ? tm(REGION_KEY[region.id]) : region.name}
          </span>
        </DialogTitle>
        <DialogDescription>
          {tm("regionSummary", {
            clubs: clubs.length,
            titles,
            active: activeCount,
            season: formatSeasonLabel(season, locale),
            clubsFmt: localizeDigits(clubs.length, locale),
            titlesFmt: localizeDigits(titles, locale),
            activeFmt: localizeDigits(activeCount, locale),
          })}
        </DialogDescription>
        <ul className="flex flex-col">
          {sorted.map((c) => {
            const active = activeSet.has(c.teamId);
            const titleCount = titlesByClub[c.teamId] ?? 0;
            // Dormant clubs link to their most recent season (one with data),
            // not the viewed season, which would 404 to the empty-state page.
            const linkSeason = active ? season : (latestByClub[c.teamId] ?? season);
            return (
              <li key={c.teamId}>
                <Link
                  href={withSeason(`/teams/${c.teamId}`, linkSeason)}
                  data-active={active ? "true" : "false"}
                  className="hover:bg-muted flex items-center gap-3 rounded-md px-2 py-2"
                >
                  <Image
                    src={clubLogo(c.teamId, season, c.logoVariants)}
                    alt=""
                    width={26}
                    height={26}
                    className={`h-[26px] w-[26px] shrink-0 object-contain ${active ? "" : "opacity-40 grayscale"}`}
                  />
                  <span className={`flex-1 text-sm ${active ? "" : "text-muted-foreground"}`}>
                    {c.name}
                  </span>
                  {titleCount > 0 && (
                    <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-xs font-medium text-amber-500">
                      {tm("titleBadge", {
                        count: titleCount,
                        countFmt: localizeDigits(titleCount, locale),
                      })}
                    </span>
                  )}
                  {titleCount === 0 && active && (
                    <span className="text-primary text-xs">{tm("active")}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
