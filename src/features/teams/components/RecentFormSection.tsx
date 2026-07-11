import "server-only";

import { getTeamRecentFixtures } from "@/features/teams/fixtures.api";

import { RecentFormStrip } from "./RecentFormStrip";

// Async Server Component wrapper around getTeamRecentFixtures, designed to
// live under a `<Suspense fallback={<RecentFormStripSkeleton />}>` boundary
// in the team-profile page. `season` is passed from the page so the
// TASK-111 season switcher re-fetches when the user picks a different year.
//
// `getTeamRecentFixtures` returns `[]` on the free-tier `Last`-parameter
// rejection — that's a deliberate empty-state signal, not a failure. We
// pass it straight through to `<RecentFormStrip>` which handles the empty
// case with its "No recent fixtures available" copy. `null` (HTTP failure
// or quota soft-block) collapses to the same empty state since the
// distinction isn't useful at the page level.
export async function RecentFormSection({ teamId, season }: { teamId: number; season: number }) {
  const fixtures = await getTeamRecentFixtures(season, teamId);
  return <RecentFormStrip fixtures={fixtures ?? []} teamId={teamId} />;
}
