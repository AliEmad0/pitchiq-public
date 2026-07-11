import "server-only";

import { getTranslations } from "next-intl/server";

import { getTeamStats } from "@/features/teams/api";

import { TeamStatsTiles } from "./TeamStatsTiles";

// Async Server Component wrapper around `getTeamStats`, designed to live
// under a `<Suspense fallback={<TeamStatsTilesSkeleton />}>` boundary in
// the team-profile page. Splitting the fetch out lets the hero stream
// before the stats payload (which is 30m-cached but cold on first hit).
// `season` is plumbed in from the page so the TASK-111 season switcher
// drives this section just like the standings call up the tree.
export async function TeamStatsSection({ teamId, season }: { teamId: number; season: number }) {
  const stats = await getTeamStats(season, teamId);

  if (!stats) {
    const t = await getTranslations("teams");
    return <p className="text-muted-foreground text-sm">{t("statsUnavailable")}</p>;
  }

  return <TeamStatsTiles stats={stats} />;
}
