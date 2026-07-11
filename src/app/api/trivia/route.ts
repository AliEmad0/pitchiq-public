import { NextResponse } from "next/server";

import { getTrivia } from "@/features/trivia/data";
import type { TriviaScope } from "@/features/trivia/types";
import { currentDataSeason, parseSeason } from "@/utils/season";

// Client-accessible trivia endpoint (TASK-1102) — parity with the other route
// handlers. The pages (TASK-1103) compute trivia server-side and pass it as
// props; this exists for client-side use. Dynamic — facts are cheap to recompute.
export const revalidate = 0;

const SCOPES: readonly TriviaScope[] = ["league", "team", "player"];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope") ?? "league";
  if (!SCOPES.includes(scope as TriviaScope)) {
    return NextResponse.json({ error: "invalid_scope" }, { status: 400 });
  }
  const season = parseSeason(searchParams.get("season") ?? undefined, currentDataSeason());
  const idRaw = searchParams.get("id");
  const id = idRaw !== null ? Number(idRaw) : undefined;
  if ((scope === "team" || scope === "player") && (id === undefined || !Number.isInteger(id))) {
    return NextResponse.json({ error: "id_required" }, { status: 400 });
  }

  const facts = await getTrivia(scope as TriviaScope, season, id);
  return NextResponse.json({ facts });
}
