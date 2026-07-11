import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/navigation";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Fixture } from "@/types/api";
import { cn } from "@/utils/cn";
import { localizeDigits } from "@/utils/format";
import { type FormResult } from "@/utils/form-badge";
import { formatShortDate } from "@/utils/format-kickoff";
import { revealProps } from "@/utils/reveal";

export type RecentFormStripProps = {
  fixtures: Fixture[]; // newest-first as returned by getTeamRecentFixtures
  teamId: number;
};

export type { FormResult };

export type FormItem = {
  fixtureId: number | string; // TASK-508: snapshot string ids pass through directly
  result: FormResult;
  opponent: { id: number; name: string; logo: string };
  scoreLine: string; // "2–1" — our goals first
  date: string; // ISO 8601
  isHome: boolean;
};

// Derive W/D/L + opponent + score from each fixture relative to a given
// team. `winner: true` on a TeamRef means that team won the match; `null`
// for both sides means a draw (or pre-match, but TASK-303 only returns
// completed `?last=` fixtures). The returned array is oldest-first so the
// leftmost card is the oldest result.
export function deriveFormItems(fixtures: Fixture[], teamId: number): FormItem[] {
  const oldestFirst = [...fixtures].reverse();
  return oldestFirst.map((fx) => {
    const isHome = fx.teams.home.id === teamId;
    const us = isHome ? fx.teams.home : fx.teams.away;
    const them = isHome ? fx.teams.away : fx.teams.home;
    const result: FormResult = us.winner === true ? "W" : us.winner === false ? "L" : "D";
    const homeGoals = fx.goals.home ?? 0;
    const awayGoals = fx.goals.away ?? 0;
    const scoreLine = isHome ? `${homeGoals}–${awayGoals}` : `${awayGoals}–${homeGoals}`;
    return {
      fixtureId: fx.fixture.id,
      result,
      opponent: them,
      scoreLine,
      date: fx.fixture.date,
      isHome,
    };
  });
}

// Score-text colour per result (the score IS the focal point of each card).
const RESULT_TEXT: Record<FormResult, string> = {
  W: "text-success",
  D: "text-muted-foreground",
  L: "text-destructive",
};

// Screen-reader result-word key per result (localized via the `teams` catalog,
// TASK-1603).
const RESULT_KEY: Record<FormResult, string> = {
  W: "resultWin",
  D: "resultDraw",
  L: "resultLoss",
};

// Phase 15 redesign (TASK-1506): "big-score cards" — a grid of cards, each with
// the scoreline as the focal point (coloured by W/D/L), the opponent (crest +
// vs/@) beneath, and the date. Each card links to its fixture page.
export function RecentFormStrip({ fixtures, teamId }: RecentFormStripProps) {
  const t = useTranslations("teams");
  const locale = useLocale();
  const items = deriveFormItems(fixtures, teamId);

  if (items.length === 0) {
    return (
      <Card className="p-4">
        <p className="text-muted-foreground text-sm">{t("noRecentFixtures")}</p>
      </Card>
    );
  }

  return (
    <section aria-label={t("recentFormHeading")} {...revealProps()}>
      <h2 className="mb-3 text-sm font-semibold tracking-tight">{t("recentFormHeading")}</h2>
      {/* Oldest-on-left, matching the rest of the page. The detail route derives
          the season from the fixture id, so a bare /fixtures/[id] href works. */}
      <ul
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
        aria-label={t("recentResults")}
      >
        {items.map((it, i) => (
          <li key={it.fixtureId} {...revealProps(i)}>
            <Link
              href={`/fixtures/${it.fixtureId}`}
              aria-label={t("fixtureAria", {
                result: t(RESULT_KEY[it.result]),
                venue: it.isHome ? t("versus") : t("awayTo"),
                opponent: it.opponent.name,
                score: localizeDigits(it.scoreLine, locale),
              })}
              className="focus-visible:ring-ring block h-full rounded-xl focus-visible:ring-2 focus-visible:outline-none"
            >
              <Card className="ix-glow h-full gap-2 p-4 text-center">
                <p className={cn("text-3xl font-bold tabular-nums", RESULT_TEXT[it.result])}>
                  {localizeDigits(it.scoreLine, locale)}
                </p>
                <div className="flex items-center justify-center gap-1.5 text-sm">
                  <span className="text-muted-foreground text-xs">
                    {it.isHome ? t("vs") : t("at")}
                  </span>
                  <Image
                    src={it.opponent.logo}
                    alt=""
                    width={18}
                    height={18}
                    className="size-4.5 shrink-0 object-contain"
                    unoptimized
                  />
                  <span className="min-w-0 truncate font-medium">{it.opponent.name}</span>
                </div>
                <p className="text-muted-foreground text-xs">{formatShortDate(it.date, locale)}</p>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

// Suspense fallback. Mirrors the big-score card grid so the swap to real data
// doesn't reflow the section.
export function RecentFormStripSkeleton() {
  const t = useTranslations("teams");
  return (
    <section aria-label={t("loading")} role="status">
      <Skeleton className="mb-3 h-4 w-24" />
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          <li key={i}>
            <Card className="gap-2 p-4">
              <Skeleton className="mx-auto h-8 w-16" />
              <Skeleton className="mx-auto h-4 w-24" />
              <Skeleton className="mx-auto h-3 w-12" />
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}
