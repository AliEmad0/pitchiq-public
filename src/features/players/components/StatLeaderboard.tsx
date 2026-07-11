import type { LucideIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PlayerImage } from "@/features/players/components/PlayerImage";
import { cn } from "@/utils/cn";
import { localizeDigits } from "@/utils/format";
import { revealProps } from "@/utils/reveal";
import { withSeason } from "@/utils/season";

export type StatLeaderboardEntry = {
  rank: number;
  name: string;
  // The player's `/players/[id]` id. Optional/nullable so the component stays
  // usable for non-football leaderboards; when present the name links.
  playerId?: number | null;
  team: string;
  // The team's `/teams/[id]` id. Optional/nullable so the component stays
  // usable for non-football leaderboards; when present the team label links.
  teamId?: number | null;
  photo: string;
  value: number;
};

type Accent = "amber" | "blue" | "yellow" | "red";

type Props = {
  title: string;
  valueLabel: string;
  entries: readonly StatLeaderboardEntry[];
  /** Color applied to the value cell. Defaults to `text-foreground`. */
  accent?: Accent;
  // Viewing season — preserved on the player/team links (TASK-M09). Optional so
  // non-football leaderboards can omit it (links stay bare → current season).
  season?: number;
  // How many rows to show. Defaults to 5 (the dashboard rails); the dedicated
  // /leaderboards page passes 10 (TASK-M18).
  limit?: number;
  // Phase 15 redesign: when set, a "See all →" link renders in the card header
  // (the dashboard bento tiles link to /leaderboards). Omitted on the
  // /leaderboards page itself.
  seeAllHref?: string;
  // Optional leading icon in the header (decorative — aria-hidden).
  icon?: LucideIcon;
  // Extra classes for the icon (e.g. yellow/red card tint).
  iconClassName?: string;
  // TASK-1513: presentation variant. "default" (the dashboard bento look) keeps
  // a plain rank column; "badge" (the /leaderboards page, concept #19) gives the
  // title an accent pill and paints a gold/silver/bronze medal disc on the top-3
  // avatars. The dashboard stays on "default" so it's untouched by the redesign.
  variant?: "default" | "badge";
};

// Medal disc styling for the top-3 in the "badge" variant. Fixed gold/silver/
// bronze — era- and theme-invariant (trophy colours), like the map's title
// badges. Ranks 4+ fall back to a muted disc.
const MEDAL_CLASS: Record<number, string> = {
  1: "bg-amber-400 text-amber-950",
  2: "bg-slate-300 text-slate-800",
  3: "bg-orange-700 text-orange-50",
};

// Per-accent value-text color. Both light + dark variants are kept on the same
// utility so the swap follows the theme class on <html> automatically.
const ACCENT_VALUE_CLASS: Record<Accent, string> = {
  amber: "text-amber-600 dark:text-amber-500",
  blue: "text-blue-600 dark:text-blue-500",
  yellow: "text-yellow-600 dark:text-yellow-500",
  red: "text-red-600 dark:text-red-500",
};

// Spec: show the top 5; collapsed "+N more" reveal not in scope here.
const TOP_N = 5;

// Reusable Card for any rank-by-N leaderboard: Top Scorers, Top Assists,
// Yellow Cards, Red Cards. Fully server-renderable — the avatar is a shared
// `<PlayerImage>` (resolves the FPL-code → PL CDN URL, else initials). The wire
// data shape (`PlayerLeaderboardEntry` from TASK-201) gets adapted into
// `StatLeaderboardEntry` at the call site so this component stays
// presentation-only and reusable for non-football leaderboards down the line.
export function StatLeaderboard({
  title,
  valueLabel,
  entries,
  accent,
  season,
  limit,
  seeAllHref,
  icon: Icon,
  iconClassName,
  variant = "default",
}: Props) {
  const top = entries.slice(0, limit ?? TOP_N);
  const valueClass = accent ? ACCENT_VALUE_CLASS[accent] : "text-foreground";
  const isBadge = variant === "badge";
  // Isomorphic hook — works in this sync Server Component (TASK-1603). `title`
  // and `valueLabel` arrive already-translated from the caller (page).
  const t = useTranslations("leaderboard");
  const tc = useTranslations("common");
  const locale = useLocale();

  return (
    <Card {...revealProps()}>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          {/* Real <h2> so the section is a navigable landmark (and the dashboard
              E2E can target it by heading role). The "badge" variant wraps the
              title in an accent pill (concept #19). */}
          <h2 className="flex items-center gap-2 text-base leading-none font-semibold">
            {Icon ? (
              <Icon className={cn("text-muted-foreground size-4", iconClassName)} aria-hidden />
            ) : null}
            {isBadge ? (
              <span className="bg-primary/10 text-primary rounded-full px-2.5 py-1 text-sm font-semibold">
                {title}
              </span>
            ) : (
              <span>{title}</span>
            )}
            <span className="text-xs font-normal text-muted-foreground">{valueLabel}</span>
          </h2>
          {seeAllHref ? (
            <Link
              href={seeAllHref}
              className="text-muted-foreground hover:text-foreground shrink-0 text-xs font-medium transition-colors"
            >
              {tc("seeAll")}
            </Link>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="px-0">
        {top.length === 0 ? (
          <p className="px-6 text-sm text-muted-foreground" role="status" aria-live="polite">
            {t("noData")}
          </p>
        ) : (
          <ol className="divide-y" aria-label={title}>
            {top.map((entry, i) => (
              <li
                key={`${entry.rank}-${entry.name}`}
                className="flex items-center gap-3 px-6 py-2.5"
                {...revealProps(i)}
              >
                {isBadge ? (
                  // "badge" variant: rank rides as a medal disc on the avatar's
                  // corner (top-3 gold/silver/bronze, else muted) — no separate
                  // rank column.
                  <div className="relative shrink-0">
                    <PlayerImage
                      player={{ name: entry.name, photo: entry.photo }}
                      size="sm"
                      className="size-9 rounded-full"
                    />
                    <span
                      className={cn(
                        "ring-card absolute -top-1 -left-1 grid size-5 place-items-center rounded-full text-[0.65rem] font-bold tabular-nums ring-2",
                        MEDAL_CLASS[entry.rank] ?? "bg-muted text-muted-foreground",
                      )}
                    >
                      {localizeDigits(entry.rank, locale)}
                    </span>
                  </div>
                ) : (
                  <>
                    <span className="w-5 text-end text-xs tabular-nums text-muted-foreground">
                      {localizeDigits(entry.rank, locale)}
                    </span>
                    <PlayerImage
                      player={{ name: entry.name, photo: entry.photo }}
                      size="sm"
                      className="size-8 rounded-full"
                    />
                  </>
                )}
                <div className="flex min-w-0 flex-1 flex-col">
                  {entry.playerId != null ? (
                    <Link
                      href={withSeason(`/players/${entry.playerId}`, season)}
                      className="truncate text-sm font-medium hover:underline"
                    >
                      {entry.name}
                    </Link>
                  ) : (
                    <span className="truncate text-sm font-medium">{entry.name}</span>
                  )}
                  {entry.teamId != null ? (
                    <Link
                      href={withSeason(`/teams/${entry.teamId}`, season)}
                      aria-label={tc("viewTeamPage", { team: entry.team })}
                      className="text-muted-foreground truncate text-xs hover:underline"
                    >
                      {entry.team}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground truncate text-xs">{entry.team}</span>
                  )}
                </div>
                <span
                  className={cn("text-base font-bold tabular-nums", valueClass)}
                  aria-label={t("value", {
                    value: localizeDigits(entry.value, locale),
                    label: valueLabel,
                  })}
                >
                  {localizeDigits(entry.value, locale)}
                </span>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
