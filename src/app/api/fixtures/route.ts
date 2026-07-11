import { NextResponse } from "next/server";

import { getNextFixtures, getRecentResults } from "@/features/leagues/fixtures.api";
import { logger } from "@/utils/logger";

export const revalidate = 60;

type Mode = "next" | "last";

function isMode(s: string | null): s is Mode {
  return s === "next" || s === "last";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const modeRaw = searchParams.get("mode");
  if (!isMode(modeRaw)) {
    return NextResponse.json({ error: "invalid_mode" }, { status: 400 });
  }

  const season = Number(searchParams.get("season") ?? new Date().getFullYear());
  const count = Number(searchParams.get("count") ?? 5);

  const data =
    modeRaw === "next"
      ? await getNextFixtures({ season, count })
      : await getRecentResults({ season, count });

  if (!data) {
    logger.warn("fixtures.route.empty", { mode: modeRaw, season, count });
    return NextResponse.json({ error: "fixtures_unavailable" }, { status: 502 });
  }

  return NextResponse.json(data);
}
