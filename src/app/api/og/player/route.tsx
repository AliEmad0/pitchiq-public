import { ImageResponse } from "next/og";

import { loadTeamColors } from "@/data/loaders";
import { getPlayerProfile } from "@/features/players/api";
import { eraForSeason } from "@/utils/era";
import { findPlayerSeasons } from "@/data/loaders";
import { currentDataSeason, formatSeasonLabel, parseSeason } from "@/utils/season";

import { renderPlayerCard } from "../player-card";
import { loadEraFonts } from "../ticket";

// Dynamic OG image for a player profile, themed by `?season=` → era (TASK-M53):
// a magazine cover. Reads `?id=&season=`. Falls back to the player's latest
// season when they didn't play the requested one (historical-only players).
// `contentType` is NOT a valid Route Handler export (ImageResponse sets it).
export const runtime = "nodejs";

const PL_CDN = "https://resources.premierleague.com/premierleague25/photos/players/110x140";

function photoUrl(photo: string): string | null {
  if (/^https?:\/\//i.test(photo)) return photo;
  if (/^\d+$/.test(photo)) return `${PL_CDN}/${photo}.png`;
  return null;
}

export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams;
  const id = Number(sp.get("id"));
  const reqSeason = parseSeason(sp.get("season") ?? undefined, currentDataSeason());
  // A player not in the requested season → use their latest season's record.
  let profile = await getPlayerProfile(id, reqSeason);
  let season = reqSeason;
  if (!profile) {
    const known = await findPlayerSeasons(id);
    if (known && known.seasons.length > 0) {
      season = known.seasons[0]; // newest-first
      profile = await getPlayerProfile(id, season);
    }
  }
  const era = eraForSeason(season);
  const fonts = await loadEraFonts(era);
  const colors = await loadTeamColors();

  const fullName = profile?.name ?? "Player";
  const parts = fullName.trim().split(/\s+/);
  const firstName = parts.length > 1 ? parts[0] : "";
  const lastName = parts.length > 1 ? parts.slice(1).join(" ") : fullName;

  const el = renderPlayerCard({
    era,
    firstName,
    lastName,
    initials:
      parts.length > 1
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : fullName.slice(0, 2).toUpperCase(),
    photoUrl: profile ? photoUrl(profile.photo) : null,
    clubColor: (profile && colors?.[String(profile.team.id)]?.home) || "#e22fd0",
    position: profile?.position ?? "Player",
    clubName: profile?.team.name ?? "Premier League",
    goals: profile?.metrics.goals ?? 0,
    assists: profile?.metrics.assists ?? 0,
    seasonLabel: formatSeasonLabel(season),
  });
  const size = { width: 1200, height: 630 } as const;
  // Modern era ships no custom fonts — OMIT `fonts` (passing `[]` disables them).
  return new ImageResponse(el, fonts.length > 0 ? { ...size, fonts } : size);
}
