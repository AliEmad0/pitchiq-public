import { useTranslations } from "next-intl";

import type { Fixture } from "@/types/api";

import { FixtureCard, type FixtureCardMode } from "./FixtureCard";

type Props = {
  mode: FixtureCardMode;
  fixtures: readonly Fixture[];
  // Viewing season — threaded to each card's team links (TASK-M09).
  season: number;
};

// Horizontally-scrollable rail of fixture cards. One component, two modes:
//   - `next`: upcoming kickoffs — score replaced with "vs"
//   - `last`: completed results — final score, losing side dimmed
//
// The card itself lives in <FixtureCard> (shared with the all-fixtures page,
// TASK-M12); this component owns only the rail layout + empty state.
//
// Kickoff times render in Europe/London (the PL's home TZ). SSR doesn't know
// the visitor's TZ; pinning to London gives a stable, contextually meaningful
// display.
export function FixturesRail({ mode, fixtures, season }: Props) {
  const t = useTranslations("fixtures");
  if (fixtures.length === 0) {
    return (
      <p className="rounded-md border bg-card p-6 text-sm text-muted-foreground" role="status">
        {mode === "next" ? t("noUpcoming") : t("noRecentResults")}
      </p>
    );
  }

  return (
    <ul
      className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
      aria-label={mode === "next" ? t("upcomingFixtures") : t("recentResults")}
    >
      {fixtures.map((fx, i) => (
        <FixtureCard
          key={fx.fixture.id}
          fixture={fx}
          mode={mode}
          season={season}
          variant="rail"
          revealIndex={i}
        />
      ))}
    </ul>
  );
}
