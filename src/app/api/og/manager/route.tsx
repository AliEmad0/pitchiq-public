import { ImageResponse } from "next/og";

import { loadTeamColors } from "@/data/loaders";
import { getManagerProfile } from "@/features/managers/manager-profile.api";
import { eraForSeason } from "@/utils/era";
import { currentDataSeason, formatSeasonLabel, parseSeason } from "@/utils/season";
import { getSiteUrl } from "@/utils/site-url";

import { renderManagerCard } from "../manager-card";
import { loadEraFonts } from "../ticket";

// Dynamic OG image for a manager profile, themed by `?season=` → era (TASK-M53):
// an accreditation pass with the club crest. Reads `?id=&season=`. Node runtime
// so the era TTFs load via fs + the loaders read committed JSON.
// `contentType` is NOT a valid Route Handler export (ImageResponse sets it).
export const runtime = "nodejs";

const PL_CDN = "https://resources.premierleague.com/premierleague25/photos/players/110x140";

function photoUrl(photo: string): string | null {
  if (/^https?:\/\//i.test(photo)) return photo;
  if (/^\d+$/.test(photo)) return `${PL_CDN}/${photo}.png`;
  return null;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams;
  const id = sp.get("id") ?? "";
  const season = parseSeason(sp.get("season") ?? undefined, currentDataSeason());
  const era = eraForSeason(season);
  const fonts = await loadEraFonts(era);

  const [profile, colors] = await Promise.all([getManagerProfile(id, season), loadTeamColors()]);
  // Prefer the viewed season's club; fall back to the manager's main club.
  const club = profile?.targetSeason?.rows[0] ?? profile?.byClub[0] ?? null;
  const site = getSiteUrl();

  const el = renderManagerCard({
    era,
    name: profile?.name ?? "Manager",
    initials: initials(profile?.name ?? "Manager"),
    photoUrl: profile ? photoUrl(profile.photo) : null,
    crestUrl: club?.teamLogo ? new URL(club.teamLogo, site).toString() : null,
    clubName: club?.teamName ?? "Premier League",
    clubColor: (club && colors?.[String(club.teamId)]?.home) || "#888888",
    seasonLabel: formatSeasonLabel(season),
  });
  const size = { width: 1200, height: 630 } as const;
  // Modern era ships no custom fonts — OMIT `fonts` (passing `[]` disables them).
  return new ImageResponse(el, fonts.length > 0 ? { ...size, fonts } : size);
}
