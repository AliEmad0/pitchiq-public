import { ImageResponse } from "next/og";

import { getStandings } from "@/features/leagues/api";
import { eraForSeason } from "@/utils/era";
import { currentDataSeason, formatSeasonLabel, parseSeason } from "@/utils/season";
import { getSiteUrl } from "@/utils/site-url";

import { renderTeamsCard } from "../teams-card";
import { loadEraFonts } from "../ticket";

// Dynamic OG image for the teams index, themed by `?season=` → era (TASK-M53).
// A file-convention opengraph-image.tsx can't read searchParams, so this Route
// Handler does. Node runtime so the era TTFs load via fs + getStandings reads
// the committed JSON.
// `contentType` is NOT a valid Route Handler export (ImageResponse sets it).
export const runtime = "nodejs";

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("season") ?? undefined;
  const season = parseSeason(raw, currentDataSeason());
  const era = eraForSeason(season);
  const fonts = await loadEraFonts(era);

  const standings = await getStandings({ season });
  const rows = standings?.league.standings[0] ?? [];
  const site = getSiteUrl();
  const crestUrls = rows.slice(0, 7).map((r) => new URL(r.team.logo, site).toString());

  const el = renderTeamsCard({ era, seasonLabel: formatSeasonLabel(season), crestUrls });
  const size = { width: 1200, height: 630 } as const;
  // Modern era ships no custom fonts — OMIT the `fonts` option (passing `[]`
  // disables fonts). Golden/retro pass their loaded era fonts.
  return new ImageResponse(el, fonts.length > 0 ? { ...size, fonts } : size);
}
