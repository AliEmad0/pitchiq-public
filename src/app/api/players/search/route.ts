import { NextResponse } from "next/server";

import { searchPlayers } from "@/features/players/api";
import { logger } from "@/utils/logger";

// Search is dynamic — freshness comes from the client TanStack Query
// staleTime (TASK-404), not Next's per-route revalidate. We still emit a
// per-query cache tag inside the fetcher for ad-hoc invalidation, but
// the route segment itself doesn't cache.
export const revalidate = 0;

// Per the TASK-403 spec: type-ahead needs at least 3 chars before it's
// worth a round-trip; below that we 400 early to keep quota intact.
const MIN_QUERY_LENGTH = 3;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  // Trim before length-checking so `?q=%20%20%20` doesn't smuggle a
  // whitespace-only query past the gate and trigger a full-table loader
  // scan on what's effectively an empty search.
  const query = (searchParams.get("q") ?? "").trim();
  if (query.length < MIN_QUERY_LENGTH) {
    return NextResponse.json({ error: "q_too_short" }, { status: 400 });
  }

  const season = Number(searchParams.get("season") ?? new Date().getFullYear());
  // TASK-1606 follow-up: localize hit names/clubs on `/ar` (client `?locale=`).
  const locale = searchParams.get("locale") ?? undefined;

  const data = await searchPlayers(query, season, locale);
  if (!data) {
    logger.warn("players-search.route.empty", { query, season });
    return NextResponse.json({ error: "search_unavailable" }, { status: 502 });
  }

  return NextResponse.json(data);
}
