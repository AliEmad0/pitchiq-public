import "server-only";

import { getLocale, getTranslations } from "next-intl/server";

import { DataUnavailable } from "@/components/DataUnavailable";
import { getSquad } from "@/features/teams/api";
import { formatSeasonLabel } from "@/utils/season";

import { SquadGrid } from "./SquadGrid";

// Async Server Component wrapper around the squad fetch, designed to live
// under a `<Suspense fallback={<SquadGridSkeleton />}>` boundary in the
// team-profile page. Splitting the fetch out of the page lets the hero
// stream while the squad endpoint resolves.
export async function SquadSection({ teamId, season }: { teamId: number; season: number }) {
  const players = await getSquad(teamId, season);

  if (!players || players.length === 0) {
    const t = await getTranslations("teams");
    const locale = await getLocale();
    return (
      <DataUnavailable
        title={t("squadUnavailable")}
        message={t("squadUnavailableMsg", { season: formatSeasonLabel(season, locale) })}
      />
    );
  }

  return <SquadGrid players={players} season={season} />;
}
