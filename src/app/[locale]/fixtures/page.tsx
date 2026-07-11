import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { fixturesOgImagePath } from "@/app/api/og/fixtures-card";
import { loadTeamColors } from "@/data/loaders";
import { FixtureBrowser } from "@/features/leagues/components/FixtureBrowser";
import { groupFixturesByDay } from "@/features/leagues/fixtures-by-day";
import { getSeasonFixtures } from "@/features/leagues/fixtures.api";
import { pickClubAccent } from "@/features/players/players-index.api";
import { localizeDigits } from "@/utils/format";
import { revealProps } from "@/utils/reveal";
import { currentDataSeason, formatSeasonLabel, parseSeason } from "@/utils/season";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ season?: string | string[] }>;
};

// Dynamic OG (crest clash grid, TASK-M53): season-pinned so each era link
// previews in its era's theme. Relative url resolves against metadataBase.
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const { season: raw } = await searchParams;
  const season = parseSeason(raw, currentDataSeason());
  const url = fixturesOgImagePath(season);
  const t = await getTranslations("fixtures");
  return {
    title: t("metaTitle", { season: formatSeasonLabel(season) }),
    openGraph: {
      images: [{ url, width: 1200, height: 630, alt: t("ogAlt") }],
    },
    twitter: { card: "summary_large_image", images: [url] },
  };
}

// TASK-M12 — the full fixtures list for a season (all 380/462 matches),
// grouped by matchday and linking each match to `/fixtures/[id]`. Reached via
// the dashboard's "See all" link (which carries the active `?season=`); the
// global header season switcher also drives the `?season=` here.
export default async function FixturesPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { season: raw } = await searchParams;
  const season = parseSeason(raw, currentDataSeason());
  const [fixtures, teamColors, t] = await Promise.all([
    getSeasonFixtures({ season }),
    loadTeamColors(),
    getTranslations("fixtures"),
  ]);
  // Newest matchday first (TASK-M36) — most relevant for browsing a season.
  const groups = fixtures ? groupFixturesByDay(fixtures, { order: "desc", locale }) : [];

  // Per-home-club accent (TASK-1507's picker) for each card's top edge.
  const accentByTeam: Record<number, string | null> = {};
  if (fixtures) {
    for (const fx of fixtures) {
      const id = fx.teams.home.id;
      if (id in accentByTeam) continue;
      const kit = teamColors?.[String(id)];
      accentByTeam[id] = pickClubAccent(kit?.home, kit?.away);
    }
  }

  return (
    <div className="container-page py-6 lg:py-10">
      <header className="mb-6 lg:mb-8" {...revealProps()}>
        <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
          {t("pageHeading")} · {formatSeasonLabel(season, locale)}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {fixtures && fixtures.length > 0
            ? t("allMatchesNewest", { count: localizeDigits(fixtures.length, locale) })
            : t("seasonSubtitle")}
        </p>
      </header>

      {groups.length === 0 ? (
        <div className="text-muted-foreground bg-card rounded-md border p-6 text-sm" role="status">
          {t("noFixtures")}
        </div>
      ) : (
        <FixtureBrowser
          groups={groups}
          season={season}
          accentByTeam={accentByTeam}
          totalCount={fixtures?.length ?? 0}
        />
      )}
    </div>
  );
}
