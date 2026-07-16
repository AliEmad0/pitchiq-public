import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { playerOgImagePath } from "@/app/api/og/player-card";
import { DataUnavailable } from "@/components/DataUnavailable";
import { EntitySeasonSwitcher } from "@/components/layout/EntitySeasonSwitcher";
import { findPlayerSeasons, loadClubLogos, loadPlayers } from "@/data/loaders";
import { getPlayerProfile } from "@/features/players/api";
import { PlayerHero } from "@/features/players/components/PlayerHero";
import { PlayerSeasonStats } from "@/features/players/components/PlayerSeasonStats";
import { PlayerSeasonSplits } from "@/features/players/components/PlayerSeasonSplits";
import { TriviaSection } from "@/features/trivia/components/TriviaSection";
import { canonicalPath } from "@/utils/canonical";
import { currentDataSeason, formatSeasonLabel, parseSeason } from "@/utils/season";

type Props = {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ season?: string | string[] }>;
};

// Players from older seasons (post-TASK-701) or non-existent ids render on
// demand and fall through to `notFound()` rather than 404'ing at routing.
export const dynamicParams = true;

// `pnpm build` pre-renders every current-season PL player as an SSG route.
// ~570 players today — bounded enough that SSG pays off; older seasons fall
// through to dynamic rendering under `dynamicParams = true`.
export async function generateStaticParams(): Promise<Array<{ id: string }>> {
  const players = await loadPlayers(currentDataSeason());
  if (!players) return [];
  return players.map((p) => ({ id: String(p.id) }));
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ locale, id }, sp] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);
  const t = await getTranslations("players");
  const tNotFound = await getTranslations("notFound");
  const playerId = Number(id);
  if (!Number.isInteger(playerId)) return { title: tNotFound("playerTitle") };
  // Dynamic OG (magazine cover, TASK-M53): season-pinned; the route falls back
  // to the player's latest season when they didn't play the requested one.
  const season = parseSeason(sp.season, currentDataSeason());
  const url = playerOgImagePath(playerId, season);
  const og = {
    openGraph: {
      images: [{ url, width: 1200, height: 630, alt: t("playerOgAlt") }],
    },
    twitter: { card: "summary_large_image" as const, images: [url] },
  };
  const alternates = { canonical: canonicalPath(locale, `/players/${playerId}`, season) };
  // Metadata is generated against the default data season (SSG-time); the
  // page body still honours `?season=` for the rendered stats.
  const profile = await getPlayerProfile(playerId, currentDataSeason());
  if (profile) {
    // Nested route — the layout's title.template appends "— PitchIQ".
    return {
      title: profile.name,
      description: t("metaDescriptionPlayer", {
        name: profile.name,
        position: profile.position,
        team: profile.team.name,
      }),
      alternates,
      ...og,
    };
  }
  // Historical-only player (not in the current season) — still a real player
  // (TASK-704 stable ids), so title them by name rather than "not found".
  // A known historical player is a real, indexable page (so it gets a canonical);
  // an unknown id is effectively not-found and must not declare one.
  const known = await findPlayerSeasons(playerId);
  return known
    ? { title: known.name, alternates, ...og }
    : { title: tNotFound("playerTitle"), ...og };
}

export default async function PlayerProfilePage({ params, searchParams }: Props) {
  const [{ locale, id }, sp] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);
  const playerId = Number(id);
  if (!Number.isInteger(playerId)) notFound();

  const season = parseSeason(sp.season, currentDataSeason());
  // `known` powers the page-local season switcher (TASK-M10), scoped to the
  // seasons this player actually appears in — so the control never offers a
  // season that would land on the empty-state below. Fetched in parallel since
  // it's independent of the per-season profile.
  const [profile, known, clubLogos] = await Promise.all([
    getPlayerProfile(playerId, season),
    findPlayerSeasons(playerId),
    loadClubLogos(),
  ]);

  // No stats for the selected season. Thanks to stable cross-season ids
  // (TASK-704), a missing profile might still be a real player who just didn't
  // play that season — show a DataUnavailable card (TASK-703) with a link back
  // to their most recent season, rather than a hard 404. A genuinely unknown id
  // appears in no season → real notFound().
  if (!profile) {
    if (!known) notFound();
    const latestSeason = known.seasons[0];
    const t = await getTranslations("players");
    return (
      <main className="container-page space-y-6 py-6 lg:py-10">
        <DataUnavailable
          title={t("noSeasonData", { season: formatSeasonLabel(season, locale), name: known.name })}
          message={t("noSeasonDataMsg", {
            name: known.name,
            season: formatSeasonLabel(season, locale),
            latest: formatSeasonLabel(latestSeason, locale),
          })}
          cta={{
            href: `/players/${playerId}?season=${latestSeason}`,
            label: t("viewSeasonStats", { season: formatSeasonLabel(latestSeason, locale) }),
          }}
        />
      </main>
    );
  }

  return (
    <main className="container-page space-y-6 py-6 lg:py-10">
      {known && <EntitySeasonSwitcher seasons={known.seasons} />}
      <PlayerHero player={profile} season={season} />
      <PlayerSeasonStats metrics={profile.metrics} />
      {profile.splits && (
        <PlayerSeasonSplits splits={profile.splits} season={season} clubLogos={clubLogos} />
      )}
      <Suspense fallback={null}>
        {/* Extra top margin (over the page's space-y-6) when a per-club splits
            table precedes the trivia, so the two sections read as distinct.
            `!` beats the space-y margin; only applies when splits render, and
            TriviaSection is null when there are no facts → no phantom gap. */}
        <TriviaSection
          scope="player"
          id={playerId}
          season={season}
          className={profile.splits ? "mt-10!" : undefined}
        />
      </Suspense>
    </main>
  );
}
