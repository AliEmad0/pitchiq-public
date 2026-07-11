import { NextResponse } from "next/server";
import { getStandings, PREMIER_LEAGUE_ID } from "@/features/leagues/api";
import { logger } from "@/utils/logger";

export const revalidate = 60;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const season = Number(searchParams.get("season") ?? new Date().getFullYear());
  const league = Number(searchParams.get("league") ?? PREMIER_LEAGUE_ID);

  const data = await getStandings({ league, season });
  if (!data) {
    logger.warn("standings.empty", { season, league });
    return NextResponse.json({ error: "standings_unavailable" }, { status: 502 });
  }

  return NextResponse.json(data);
}
