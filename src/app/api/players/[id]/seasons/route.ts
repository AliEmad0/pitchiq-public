import { NextResponse } from "next/server";

import { findPlayerSeasons } from "@/data/loaders";
import { logger } from "@/utils/logger";

// TASK-M24: the seasons a player appears in (newest-first), for the per-slot
// season dropdown on /compare. Season-independent → cached by id client-side.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isFinite(id) || !Number.isInteger(id)) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }
  const info = await findPlayerSeasons(id);
  if (!info) {
    logger.info("player-seasons.route.not_found", { id });
    return NextResponse.json({ error: "player_not_found" }, { status: 404 });
  }
  return NextResponse.json({ seasons: info.seasons });
}
