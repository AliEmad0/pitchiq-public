import { ManagerSection } from "@/features/teams/components/ManagerSection";
import { getTeamManagers } from "@/features/teams/managers.api";

/**
 * Async wrapper (TASK-M48) that fetches the season's manager(s) for a team and
 * hands them to the presentational `<ManagerSection>`. Streams under its own
 * Suspense boundary on `/teams/[id]`; renders nothing when there's no manager
 * data for the season (legacy 1992-2007).
 */
export async function ManagerSectionLoader({ season, teamId }: { season: number; teamId: number }) {
  const managers = await getTeamManagers(season, teamId);
  return <ManagerSection managers={managers} season={season} />;
}
