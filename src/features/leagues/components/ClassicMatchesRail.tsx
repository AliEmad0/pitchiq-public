import { useLocale, useTranslations } from "next-intl";

import type { ClassicMatchView } from "@/features/leagues/classic-matches.api";
import { localizeDigits } from "@/utils/format";

import { FixtureCard } from "./FixtureCard";

type Props = {
  matches: readonly ClassicMatchView[];
  // Viewing season — threaded to each card's team links (TASK-M09).
  season: number;
};

// TASK-M14 — horizontally-scrollable rail of the season's most notable matches
// (completed only, so always `last` mode), each card carrying its contextual
// catalyst badge. Mirrors <FixturesRail>'s rail layout; the card itself is the
// shared <FixtureCard>.
export function ClassicMatchesRail({ matches, season }: Props) {
  const t = useTranslations("fixtures");
  const locale = useLocale();
  if (matches.length === 0) {
    return (
      <p className="rounded-md border bg-card p-6 text-sm text-muted-foreground" role="status">
        {t("noClassicMatches")}
      </p>
    );
  }

  return (
    <ul
      className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
      aria-label={t("classicMatches")}
    >
      {matches.map(({ fixture, badge }) => (
        <FixtureCard
          key={fixture.fixture.id}
          fixture={fixture}
          mode="last"
          season={season}
          variant="rail"
          badge={t(
            badge.key,
            badge.total !== undefined
              ? { total: badge.total, totalFmt: localizeDigits(badge.total, locale) }
              : {},
          )}
        />
      ))}
    </ul>
  );
}
