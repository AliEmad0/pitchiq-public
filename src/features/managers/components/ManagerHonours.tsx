import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Trophy } from "lucide-react";

import type { ManagerTitleRow } from "@/features/managers/manager-profile.api";
import { revealProps } from "@/utils/reveal";
import { formatSeasonLabel, withSeason } from "@/utils/season";

/**
 * A manager's auto-derived PL titles (TASK-M49 → TASK-1510 "trophy cards"
 * redesign) — each a gold-edged trophy card (season + club link). A season where
 * his club finished 1st and he was its primary manager (2008+). Renders nothing
 * when there are none.
 */
export function ManagerHonours({
  honours,
  season,
}: {
  honours: ManagerTitleRow[];
  season: number;
}) {
  const t = useTranslations("managers");
  const locale = useLocale();
  if (honours.length === 0) return null;
  return (
    <section aria-label={t("honours")} className="space-y-3" {...revealProps()}>
      <h2 className="text-sm font-semibold tracking-tight">{t("honours")}</h2>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {honours.map((row, i) => (
          <li key={`${row.season}-${row.teamId}`} {...revealProps(i)}>
            <div className="bg-card flex flex-col items-center gap-1 rounded-xl border border-t-[3px] border-t-amber-400 p-4 text-center">
              <Trophy className="size-7 text-amber-500" aria-hidden />
              <p className="text-muted-foreground mt-1 text-[11px] font-semibold tracking-wide uppercase">
                {t("premierLeague")}
              </p>
              <p className="text-lg font-bold tabular-nums">
                {formatSeasonLabel(row.season, locale)}
              </p>
              <Link
                href={withSeason(`/teams/${row.teamId}`, season)}
                className="text-muted-foreground text-xs hover:underline"
              >
                {row.teamName}
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
