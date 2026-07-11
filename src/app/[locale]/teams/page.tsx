import { Shield } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { teamsOgImagePath } from "@/app/api/og/teams-card";
import { loadTeamColors } from "@/data/loaders";
import { TeamFilter } from "@/features/teams/components/TeamFilter";
import { getPLTeams } from "@/features/teams/api";
import { revealProps } from "@/utils/reveal";
import { currentDataSeason, formatSeasonLabel, parseSeason } from "@/utils/season";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ season?: string | string[] }>;
};

// Dynamic OG (diagonal-split teams card, TASK-M53): season-pinned so each era
// link previews in its era's theme. The relative url resolves against the
// layout's metadataBase.
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const season = parseSeason(sp.season, currentDataSeason());
  const url = teamsOgImagePath(season);
  const t = await getTranslations("teams");
  return {
    title: t("clubs"),
    description: t("metaDescription"),
    openGraph: {
      images: [{ url, width: 1200, height: 630, alt: t("ogAlt") }],
    },
    twitter: { card: "summary_large_image", images: [url] },
  };
}

// Server Component: fetches the full league/season team list once and hands
// it to the `<TeamFilter>` client component. Reads `?season=` from the URL
// (TASK-111) so the header season switcher drives which season is rendered;
// invalid / missing values fall back to `currentDataSeason()` (the latest
// season for which data is committed — currently 2025) via `parseSeason`.
export default async function TeamsIndexPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const season = parseSeason(sp.season, currentDataSeason());
  const t = await getTranslations("teams");
  // Team metadata + curated kit colours load in parallel; the colours paint each
  // card's accent + hover ring (TASK-1505 "polished crest grid").
  const [teams, teamColors] = await Promise.all([getPLTeams(season), loadTeamColors()]);

  if (!teams || teams.length === 0) {
    return (
      <main className="container-page py-6 lg:py-10">
        <h1 className="text-3xl font-semibold tracking-tight">{t("clubs")}</h1>
        <p className="text-muted-foreground mt-4 text-sm">{t("listUnavailable")}</p>
      </main>
    );
  }

  const colors: Record<number, string> = {};
  if (teamColors) {
    for (const [id, c] of Object.entries(teamColors)) colors[Number(id)] = c.home;
  }

  return (
    <main className="container-page space-y-6 py-6 lg:py-10">
      <header {...revealProps()}>
        <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight">
          <Shield className="text-primary size-7" aria-hidden />
          {t("clubs")}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {t("everyClub", { season: formatSeasonLabel(season, locale) })}
        </p>
      </header>
      <TeamFilter teams={teams} season={season} colors={colors} />
    </main>
  );
}
