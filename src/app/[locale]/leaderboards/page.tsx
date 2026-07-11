import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { leaderboardsOgImagePath } from "@/app/api/og/leaderboards-card";
import { DataUnavailable } from "@/components/DataUnavailable";
import { loadPlayers } from "@/data/loaders";
import { StatLeaderboard } from "@/features/players/components/StatLeaderboard";
import { buildBoards } from "@/features/players/leaderboards-index";
import { revealProps } from "@/utils/reveal";
import { currentDataSeason, formatSeasonLabel, parseSeason } from "@/utils/season";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ season?: string | string[] }>;
};

// Dynamic OG (stat heat grid of each category's season leader, TASK-M53):
// season-pinned so each era link previews in its era's theme. Relative url
// resolves against the layout's metadataBase.
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const season = parseSeason(sp.season, currentDataSeason());
  const url = leaderboardsOgImagePath(season);
  const t = await getTranslations("leaderboard");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    openGraph: {
      images: [{ url, width: 1200, height: 630, alt: t("ogAlt") }],
    },
    twitter: { card: "summary_large_image", images: [url] },
  };
}

// Server Component: ranks the season's players in-memory (read-time, like the
// /players index) into every available leaderboard. Boards with no data for the
// season are omitted. `?season=` is driven by the header switcher.
export default async function LeaderboardsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const season = parseSeason(sp.season, currentDataSeason());
  const players = await loadPlayers(season);
  const boards = players ? buildBoards(players) : [];
  const t = await getTranslations("leaderboard");
  const tc = await getTranslations("common");
  const tp = await getTranslations("players");

  return (
    <main className="container-page space-y-6 py-6 lg:py-10">
      <div {...revealProps()}>
        <h1 className="text-3xl font-semibold tracking-tight">{t("pageTitle")}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{formatSeasonLabel(season, locale)}</p>
      </div>
      {boards.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {boards.map(({ cat, rows }) => (
            <StatLeaderboard
              key={cat.key}
              title={t(cat.titleKey)}
              valueLabel={t(cat.valueLabelKey)}
              entries={rows}
              accent={cat.accent}
              season={season}
              limit={10}
              variant="badge"
            />
          ))}
        </div>
      ) : (
        <DataUnavailable
          title={t("noData2")}
          message={tp("noDataMsg")}
          cta={{
            href: `/leaderboards?season=${currentDataSeason()}`,
            label: tc("viewLatestSeason"),
          }}
        />
      )}
    </main>
  );
}
