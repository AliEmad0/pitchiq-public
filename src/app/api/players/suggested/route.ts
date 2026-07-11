import { NextResponse } from "next/server";

import { getSuggestedPlayers } from "@/features/players/api";
import { currentDataSeason, parseSeason } from "@/utils/season";

// Suggestions are derived from the committed leaderboard/player snapshots, so
// freshness is owned by the client TanStack Query staleTime (TASK-604), not a
// per-route revalidate.
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const season = parseSeason(searchParams.get("season") ?? undefined, currentDataSeason());
  // TASK-1606 follow-up: localize the suggested-card names on `/ar` (client
  // sends `?locale=` via `useLocale()`; a Route Handler has no request context).
  const locale = searchParams.get("locale") ?? undefined;

  // getSuggestedPlayers always resolves (empty sections for an unknown season),
  // so there's no upstream-error branch to surface here.
  const data = await getSuggestedPlayers(season, locale);
  return NextResponse.json(data);
}
