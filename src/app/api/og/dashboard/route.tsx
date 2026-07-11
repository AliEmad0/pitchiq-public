import { ImageResponse } from "next/og";

import { eraForSeason } from "@/utils/era";
import { currentDataSeason, formatSeasonLabel, parseSeason } from "@/utils/season";

import { loadEraFonts, renderTicket } from "../ticket";

// Dynamic OG image for the dashboard, themed by `?season=` → era (TASK-M:
// era-themed matchday-ticket OG). A file-convention opengraph-image.tsx can't
// read searchParams, so this Route Handler does. Node runtime so the era TTFs
// load via fs.
// `runtime` is a valid Route Handler export; `contentType` is NOT (that's a
// metadata-route export) — `ImageResponse` already sets Content-Type: image/png.
export const runtime = "nodejs";

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("season") ?? undefined;
  const season = parseSeason(raw, currentDataSeason());
  const era = eraForSeason(season);
  const fonts = await loadEraFonts(era);
  const el = renderTicket({
    era,
    seasonLabel: formatSeasonLabel(season),
    headline: "PitchIQ",
    tagline: "Premier League, decoded.",
    passLabel: "MATCHDAY PASS · ALL 34 SEASONS",
    navLine: "Teams · Leaderboards · Fixtures · Compare",
  });
  const size = { width: 1200, height: 630 } as const;
  // Modern era ships no custom fonts — OMIT the `fonts` option so next/og uses
  // its bundled default. Passing `fonts: []` disables fonts entirely ("No fonts
  // are loaded"). Golden/retro pass their loaded era fonts.
  return new ImageResponse(el, fonts.length > 0 ? { ...size, fonts } : size);
}
