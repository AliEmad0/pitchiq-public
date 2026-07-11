"use client";

import { useLocale, useTranslations } from "next-intl";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { formatSeasonLabel } from "@/utils/season";

import { SeasonSwitcher } from "./SeasonSwitcher";

// Page-local season control for entity detail pages (`/players/[id]`,
// `/teams/[id]`) — TASK-M10. Unlike the global header switcher (all 34
// committed seasons), this offers ONLY the seasons the entity has data for,
// so the user can't pick a season that lands on an empty-state/404.
//
// `seasons` is the entity-scoped, newest-first list from `findPlayerSeasons` /
// `findTeamSeasons`. A single-season entity (e.g. a one-season club like
// Blackpool) renders a static label rather than a pointless one-item dropdown.
//
// The multi-season branch reuses the global <SeasonSwitcher> (same `?season=`
// URL binding, same `shallow: false` RSC refetch). Its `useSeason` calls
// `useSearchParams`, which needs a <Suspense> ancestor or the host page bails
// out of static prerender — so the boundary is self-contained here.
export function EntitySeasonSwitcher({ seasons }: { seasons: number[] }) {
  const t = useTranslations("controls");
  const locale = useLocale();
  // Defensive: callers only render this for an entity that has ≥1 season, but
  // never crash on an empty list.
  if (seasons.length === 0) return null;
  return (
    <div className="flex items-center justify-end gap-2">
      <span className="text-muted-foreground text-xs font-medium">{t("season")}</span>
      {seasons.length === 1 ? (
        <span className="text-sm font-medium tabular-nums">
          {formatSeasonLabel(seasons[0], locale)}
        </span>
      ) : (
        <Suspense fallback={<Skeleton className="h-9 w-[110px] rounded-md" />}>
          <SeasonSwitcher seasons={seasons} />
        </Suspense>
      )}
    </div>
  );
}
