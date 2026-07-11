import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { playersOgImagePath } from "@/app/api/og/players-card";
import { DataUnavailable } from "@/components/DataUnavailable";
import { PlayersTable } from "@/features/players/components/PlayersTable";
import { TopPlayersStrip } from "@/features/players/components/TopPlayersStrip";
import { getSeasonPlayers } from "@/features/players/players-index.api";
import { localizeDigits } from "@/utils/format";
import { revealProps } from "@/utils/reveal";
import { currentDataSeason, formatSeasonLabel, parseSeason } from "@/utils/season";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ season?: string | string[] }>;
};

// Dynamic OG (headshot row of top contributors, TASK-M53): season-pinned so
// each era link previews in its era's theme. Relative url resolves against
// the layout's metadataBase.
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const season = parseSeason(sp.season, currentDataSeason());
  const url = playersOgImagePath(season);
  const t = await getTranslations("players");
  return {
    title: t("pageTitle"),
    description: t("metaDescription"),
    openGraph: {
      images: [{ url, width: 1200, height: 630, alt: t("ogAlt") }],
    },
    twitter: { card: "summary_large_image", images: [url] },
  };
}

// Server Component: the season's players ranked by goals+assists, handed to a
// showcase strip (top 8) + the <PlayersTable> client island (filter/sort).
// Reads `?season=` (header switcher drives it).
export default async function PlayersIndexPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const season = parseSeason(sp.season, currentDataSeason());
  const rows = await getSeasonPlayers(season);
  const t = await getTranslations("players");
  const tc = await getTranslations("common");

  return (
    <main className="container-page space-y-6 py-6 lg:py-10">
      <div {...revealProps()}>
        <h1 className="text-3xl font-semibold tracking-tight">{t("pageTitle")}</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {formatSeasonLabel(season, locale)} ·{" "}
          {rows
            ? t("playersCount", {
                count: rows.length,
                countFmt: localizeDigits(rows.length, locale),
              })
            : t("rankedBy")}
        </p>
      </div>
      {rows && rows.length > 0 ? (
        <>
          <TopPlayersStrip rows={rows} season={season} />
          <PlayersTable rows={rows} season={season} />
        </>
      ) : (
        <DataUnavailable
          title={t("noData")}
          message={t("noDataMsg")}
          cta={{ href: `/players?season=${currentDataSeason()}`, label: tc("viewLatestSeason") }}
        />
      )}
    </main>
  );
}
