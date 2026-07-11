import {
  AlertTriangle,
  Crosshair,
  Flag,
  Flame,
  Frown,
  Goal,
  RectangleVertical,
  Shield,
  ShieldCheck,
  Target,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { TeamStats } from "@/types/api";
import { formatNumber } from "@/utils/format";
import { revealProps } from "@/utils/reveal";

type TileSpec = {
  label: string;
  value: number | null;
  icon: LucideIcon;
};

// Season-level KPIs sourced from `getTeamStats`. Goals for/against come from the
// standings; the rest are derived read-time from the committed fixtures
// (`aggregateTeamSeasonStats`, TASK-M17). Per-game + card tiles render "—" for
// pre-2000 seasons (no per-match stats); results-only tiles populate for all.
//
// Phase 15 redesign (TASK-1506): the tiles are a "stat heat grid" — each
// populated tile is tinted with the era-accent (`--primary`) at an intensity
// scaled to its value (relative to the largest value in the set), so the grid
// reads as a heatmap. The tint is mixed INTO `--card` (`color-mix`) so the
// foreground text keeps its contrast in both light + dark + every era.
export function TeamStatsTiles({ stats }: { stats: TeamStats }) {
  const t = useTranslations("teams");
  const tiles: TileSpec[] = [
    { label: t("statGoalsFor"), value: stats.goals.for.total.total, icon: Goal },
    { label: t("statGoalsAgainst"), value: stats.goals.against.total.total, icon: Shield },
    { label: t("statCleanSheets"), value: stats.clean_sheet.total, icon: ShieldCheck },
    { label: t("statFailedToScore"), value: stats.failed_to_score.total, icon: Frown },
    { label: t("statBiggestWinStreak"), value: stats.biggest.streak.wins, icon: TrendingUp },
    { label: t("statBiggestLosingStreak"), value: stats.biggest.streak.loses, icon: TrendingDown },
    { label: t("statLongestUnbeaten"), value: stats.longestUnbeaten ?? null, icon: Flame },
    { label: t("statAvgShots"), value: stats.perGame?.shots ?? null, icon: Target },
    {
      label: t("statAvgShotsOnTarget"),
      value: stats.perGame?.shotsOnTarget ?? null,
      icon: Crosshair,
    },
    { label: t("statAvgCorners"), value: stats.perGame?.corners ?? null, icon: Flag },
    { label: t("statAvgFouls"), value: stats.perGame?.fouls ?? null, icon: AlertTriangle },
    { label: t("statYellowCards"), value: stats.cards?.yellow ?? null, icon: RectangleVertical },
  ];

  // Heat is relative to the largest populated value, so the busiest stat is the
  // hottest. `1` floor avoids a divide-by-zero when every tile is null.
  const max = Math.max(
    1,
    ...tiles.map((tile) => tile.value).filter((v): v is number => v !== null),
  );

  return (
    <section aria-label={t("seasonStats")}>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {tiles.map((tile, i) => (
          <HeatTile key={tile.label} {...tile} max={max} revealIndex={i} />
        ))}
      </ul>
    </section>
  );
}

function HeatTile({
  label,
  value,
  icon: Icon,
  max,
  revealIndex,
}: TileSpec & { max: number; revealIndex: number }) {
  const locale = useLocale();
  const heat = value !== null ? Math.round((value / max) * 100) : null;
  // Tint depth 14%→54% so even small values get a visible — but readable — tint.
  const pct = heat !== null ? 14 + (value! / max) * 40 : 0;
  return (
    <li
      data-heat={heat ?? undefined}
      data-reveal=""
      className="flex flex-col gap-2 rounded-xl border bg-card p-4"
      style={{
        // Manual merge — the heat tint and the reveal stagger share the tile's
        // inline style (TASK-1704).
        ...revealProps(revealIndex).style,
        ...(heat !== null
          ? { backgroundColor: `color-mix(in srgb, var(--primary) ${pct}%, var(--card))` }
          : undefined),
      }}
    >
      <div className="text-foreground/75 flex items-center gap-2 text-xs font-medium">
        <Icon className="size-3.5" aria-hidden />
        <span className="truncate">{label}</span>
      </div>
      <p className="text-2xl font-bold tabular-nums lg:text-3xl">
        {value !== null ? formatNumber(value, locale) : "—"}
      </p>
    </li>
  );
}

// Suspense fallback. Twelve skeleton tiles in the same 2/3/6 column grid so
// the swap to real data doesn't reflow the rows.
export function TeamStatsTilesSkeleton() {
  const t = useTranslations("teams");
  return (
    <section aria-label={t("seasonStatsLoading")}>
      <ul
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
        role="status"
        aria-label={t("loading")}
      >
        {Array.from({ length: 12 }, (_, i) => (
          <li key={i}>
            <Card className="gap-2 p-4">
              <div className="flex items-center gap-2">
                <Skeleton className="size-3.5 shrink-0" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="mt-1 h-7 w-12" />
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}
