import { ImageResponse } from "next/og";

import { loadTeamColors } from "@/data/loaders";
import { getSeasonPlayers } from "@/features/players/players-index.api";
import { eraForSeason } from "@/utils/era";
import { currentDataSeason, formatSeasonLabel, parseSeason } from "@/utils/season";

import { renderPlayersCard, type PlayersCardPlayer } from "../players-card";
import { loadEraFonts } from "../ticket";

// Dynamic OG image for the players index, themed by `?season=` → era (TASK-M53):
// a headshot row of the season's most valuable players (goals + assists).
// `contentType` is NOT a valid Route Handler export (ImageResponse sets it).
export const runtime = "nodejs";

const PL_CDN = "https://resources.premierleague.com/premierleague25/photos/players/110x140";

function photoUrl(photo: string | null): string | null {
  if (!photo) return null;
  if (/^https?:\/\//i.test(photo)) return photo;
  if (/^\d+$/.test(photo)) return `${PL_CDN}/${photo}.png`;
  return null;
}

function surname(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts[parts.length - 1] || name;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("season") ?? undefined;
  const season = parseSeason(raw, currentDataSeason());
  const era = eraForSeason(season);
  const fonts = await loadEraFonts(era);

  const [rows, colors] = await Promise.all([getSeasonPlayers(season), loadTeamColors()]);
  const players: PlayersCardPlayer[] = (rows ?? []).slice(0, 7).map((r) => ({
    name: surname(r.name),
    initials: initials(r.name),
    photoUrl: photoUrl(r.photo),
    clubColor: colors?.[String(r.teamId)]?.home ?? "#888888",
    ga: r.contributions,
  }));

  const el = renderPlayersCard({ era, seasonLabel: formatSeasonLabel(season), players });
  const size = { width: 1200, height: 630 } as const;
  // Modern era ships no custom fonts — OMIT `fonts` (passing `[]` disables them).
  return new ImageResponse(el, fonts.length > 0 ? { ...size, fonts } : size);
}
