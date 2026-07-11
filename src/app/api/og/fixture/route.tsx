import { ImageResponse } from "next/og";

import { loadTeamColors } from "@/data/loaders";
import { getFixtureDetail } from "@/features/leagues/fixture-detail.api";
import { eraForSeason } from "@/utils/era";
import { currentDataSeason, formatSeasonLabel, seasonFromFixtureId } from "@/utils/season";
import { getSiteUrl } from "@/utils/site-url";

import { renderFixtureCard, type FixtureCardTeam } from "../fixture-card";
import { loadEraFonts } from "../ticket";

// Dynamic OG image for a fixture detail, themed by the fixture's season → era
// (TASK-M53): a matchday ticket stub. Reads `?id=`; the season is derived from
// the fixture id (Aug–May → start year), like the page.
// `contentType` is NOT a valid Route Handler export (ImageResponse sets it).
export const runtime = "nodejs";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function abbr(name: string): string {
  return name
    .replace(/[^A-Za-z]/g, "")
    .slice(0, 3)
    .toUpperCase();
}

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id") ?? "";
  const season = seasonFromFixtureId(id) ?? currentDataSeason();
  const era = eraForSeason(season);
  const fonts = await loadEraFonts(era);
  const colors = await loadTeamColors();
  const detail = await getFixtureDetail(id);
  const site = getSiteUrl();

  const team = (t: { id: number; name: string; logo: string }): FixtureCardTeam => ({
    crestUrl: t.logo ? new URL(t.logo, site).toString() : null,
    abbr: abbr(t.name),
    name: t.name,
    color: colors?.[String(t.id)]?.home ?? "#888888",
  });

  let home: FixtureCardTeam = { crestUrl: null, abbr: "", name: "Home", color: "#888888" };
  let away: FixtureCardTeam = { crestUrl: null, abbr: "", name: "Away", color: "#888888" };
  let homeScore: number | null = null;
  let awayScore: number | null = null;
  let metaLine = "Premier League";

  if (detail) {
    const af = detail.fixture;
    home = team(af.teams.home);
    away = team(af.teams.away);
    homeScore = af.goals.home;
    awayScore = af.goals.away;
    const d = new Date(af.fixture.date);
    const dateStr = `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
    const venue = af.fixture.venue?.name ?? "";
    const att = af.fixture.attendance ? ` · ${af.fixture.attendance.toLocaleString("en-GB")}` : "";
    metaLine = [dateStr, venue].filter(Boolean).join(" · ") + att;
  }

  const el = renderFixtureCard({
    era,
    home,
    away,
    homeScore,
    awayScore,
    metaLine,
    seasonLabel: formatSeasonLabel(season),
  });
  const size = { width: 1200, height: 630 } as const;
  // Modern era ships no custom fonts — OMIT `fonts` (passing `[]` disables them).
  return new ImageResponse(el, fonts.length > 0 ? { ...size, fonts } : size);
}
