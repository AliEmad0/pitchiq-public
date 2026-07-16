import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { managersOgImagePath } from "@/app/api/og/managers-card";
import { DataUnavailable } from "@/components/DataUnavailable";
import { ManagerStatHighlights } from "@/features/managers/components/ManagerStatHighlights";
import { ManagersTable } from "@/features/managers/components/ManagersTable";
import { getSeasonManagers } from "@/features/managers/managers-index.api";
import { revealProps } from "@/utils/reveal";
import { currentDataSeason, formatSeasonLabel, parseSeason } from "@/utils/season";
import { canonicalPath } from "@/utils/canonical";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ season?: string | string[] }>;
};

// Dynamic OG (sticker-pack of the season's top managers, TASK-M53): season-
// pinned so each era link previews in its era's theme. Relative url resolves
// against the layout's metadataBase.
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const season = parseSeason(sp.season, currentDataSeason());
  const url = managersOgImagePath(season);
  const t = await getTranslations("managers");
  return {
    title: t("pageTitle"),
    alternates: { canonical: canonicalPath(locale, "/managers", season) },
    description: t("metaDescription"),
    openGraph: {
      images: [{ url, width: 1200, height: 630, alt: t("ogAlt") }],
    },
    twitter: { card: "summary_large_image", images: [url] },
  };
}

// Server Component: the season's managers (one row per manager-club), ranked by
// points, handed to the <ManagersTable> client island for filter/sort. Reads
// `?season=` (the header switcher drives it); legacy seasons with no manager
// data render the empty-state.
export default async function ManagersIndexPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const season = parseSeason(sp.season, currentDataSeason());
  const rows = await getSeasonManagers(season);
  const t = await getTranslations("managers");
  const tc = await getTranslations("common");

  return (
    <main className="container-page space-y-6 py-6 lg:py-10">
      <div {...revealProps()}>
        <h1 className="text-3xl font-semibold tracking-tight">{t("pageTitle")}</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {formatSeasonLabel(season, locale)} · {t("rankedByPoints")}
        </p>
      </div>
      {rows && rows.length > 0 ? (
        <>
          <ManagerStatHighlights rows={rows} />
          <ManagersTable rows={rows} season={season} />
        </>
      ) : (
        <DataUnavailable
          title={t("noData")}
          message={t("noDataMsg")}
          cta={{ href: `/managers?season=${currentDataSeason()}`, label: tc("viewLatestSeason") }}
        />
      )}
    </main>
  );
}
