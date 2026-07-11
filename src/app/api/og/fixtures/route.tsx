import { ImageResponse } from "next/og";

import { loadTeamColors } from "@/data/loaders";
import { getSeasonFixtures } from "@/features/leagues/fixtures.api";
import { eraForSeason } from "@/utils/era";
import { currentDataSeason, formatSeasonLabel, parseSeason } from "@/utils/season";
import { getSiteUrl } from "@/utils/site-url";

import { renderFixturesCard, type FixturesCardPair } from "../fixtures-card";
import { loadEraFonts } from "../ticket";

// Dynamic OG image for the fixtures index, themed by `?season=` → era (TASK-M53):
// a grid of crest-vs-crest clashes.
// `contentType` is NOT a valid Route Handler export (ImageResponse sets it).
export const runtime = "nodejs";

function abbr(name: string): string {
  return name
    .replace(/[^A-Za-z]/g, "")
    .slice(0, 3)
    .toUpperCase();
}

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("season") ?? undefined;
  const season = parseSeason(raw, currentDataSeason());
  const era = eraForSeason(season);
  const fonts = await loadEraFonts(era);

  const [fixtures, colors] = await Promise.all([getSeasonFixtures({ season }), loadTeamColors()]);
  const site = getSiteUrl();
  const team = (t: { id: number; name: string; logo: string }) => ({
    crestUrl: t.logo ? new URL(t.logo, site).toString() : null,
    abbr: abbr(t.name),
    color: colors?.[String(t.id)]?.home ?? "#888888",
  });
  const pairs: FixturesCardPair[] = (fixtures ?? [])
    .slice(0, 6)
    .map((f) => ({ home: team(f.teams.home), away: team(f.teams.away) }));

  const el = renderFixturesCard({ era, seasonLabel: formatSeasonLabel(season), pairs });
  const size = { width: 1200, height: 630 } as const;
  // Modern era ships no custom fonts — OMIT `fonts` (passing `[]` disables them).
  return new ImageResponse(el, fonts.length > 0 ? { ...size, fonts } : size);
}
