import { NextResponse } from "next/server";

import { getPlayerSlim } from "@/features/players/api";
import { logger } from "@/utils/logger";

// Slot-picker hydrate endpoint (TASK-405). When the `/compare` URL has
// `?a=<id>` or `?b=<id>` but the in-memory state is empty (page reload,
// inbound deeplink), the slot picker calls here to fetch the slim
// `{ id, name, team, photo }` shape it needs to render the card.
//
// Route revalidate intentionally inherits the fetcher's own
// `revalidate: 3600` + cache-tag from `getPlayerStats`'s URL (same
// upstream call → Next dedupes). We don't set a per-route value here.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isFinite(id) || !Number.isInteger(id)) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const season = Number(searchParams.get("season") ?? new Date().getFullYear());
  // TASK-1606 follow-up: the slot card localizes name/club/position/nationality
  // on `/ar`. Route Handlers have no `[locale]` segment, so the client sends the
  // active locale explicitly (`?locale=`, via `useLocale()`).
  const locale = searchParams.get("locale") ?? undefined;

  const data = await getPlayerSlim(id, season, locale);
  if (!data) {
    logger.info("player-slim.route.not_found", { id, season });
    // 404 covers both "unknown id" and "upstream failure" — the slot
    // picker treats either as "stale URL state" and clears the slot.
    // If we ever need to distinguish the two we'd teach `getPlayerSlim`
    // to return a discriminated union; for the slot-picker UX it
    // doesn't matter.
    return NextResponse.json({ error: "player_not_found" }, { status: 404 });
  }

  return NextResponse.json(data);
}
