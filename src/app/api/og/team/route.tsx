import { ImageResponse } from "next/og";

import { loadTeamColors } from "@/data/loaders";
import { getStandings } from "@/features/leagues/api";
import { eraForSeason } from "@/utils/era";
import { currentDataSeason, formatSeasonLabel, parseSeason } from "@/utils/season";
import { getSiteUrl } from "@/utils/site-url";

import { loadTeamCardFonts, renderTeamCard } from "../team-card";

// Dynamic OG image for a team profile, themed by `?season=` → era (TASK-M53):
// neon (modern/golden) or dossier (retro90s). Reads `?teamId=&season=` — a
// file-convention opengraph-image.tsx can't read searchParams. Node runtime so
// the era TTFs load via fs + getStandings reads the committed JSON.
// `contentType` is NOT a valid Route Handler export (ImageResponse sets it).
export const runtime = "nodejs";

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}

export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams;
  const season = parseSeason(sp.get("season") ?? undefined, currentDataSeason());
  const teamId = Number(sp.get("teamId"));
  const era = eraForSeason(season);
  const fonts = await loadTeamCardFonts(era);

  const [standings, colors] = await Promise.all([getStandings({ season }), loadTeamColors()]);
  const rows = standings?.league.standings[0] ?? [];
  const row = rows.find((r) => r.team.id === teamId) ?? null;
  const clubColor = colors?.[String(teamId)]?.home ?? null;

  const el = renderTeamCard({
    era,
    clubName: row?.team.name ?? "Premier League",
    crestUrl: row ? new URL(row.team.logo, getSiteUrl()).toString() : null,
    clubColor,
    seasonLabel: formatSeasonLabel(season),
    rankLabel: row ? ordinal(row.rank) : "—",
    points: row?.points ?? 0,
    goalDiff: row ? (row.goalsDiff > 0 ? `+${row.goalsDiff}` : String(row.goalsDiff)) : "—",
  });
  const size = { width: 1200, height: 630 } as const;
  // Modern era ships no custom fonts — OMIT `fonts` (passing `[]` disables them).
  return new ImageResponse(el, fonts.length > 0 ? { ...size, fonts } : size);
}
