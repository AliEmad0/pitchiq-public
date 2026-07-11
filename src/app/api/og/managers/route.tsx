import { ImageResponse } from "next/og";

import { loadTeamColors } from "@/data/loaders";
import { getSeasonManagers } from "@/features/managers/managers-index.api";
import { eraForSeason } from "@/utils/era";
import { currentDataSeason, formatSeasonLabel, parseSeason } from "@/utils/season";

import { renderManagersCard, type ManagerCard } from "../managers-card";
import { loadEraFonts } from "../ticket";

// Dynamic OG image for the managers index, themed by `?season=` → era (TASK-M53):
// a "sticker pack" of the season's top managers by points. Node runtime so the
// era TTFs load via fs + the loaders read committed JSON.
// `contentType` is NOT a valid Route Handler export (ImageResponse sets it).
export const runtime = "nodejs";

const PL_CDN = "https://resources.premierleague.com/premierleague25/photos/players/110x140";

// Manager `photo` is the PL id (numeric → CDN headshot), a bio-override URL, or
// a legacy `lm-<slug>` id with no headshot (→ null, card shows initials).
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

// The fanned cards overlap, so the full name would be clipped — show the
// surname (last token), the way real manager stickers do.
function surname(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts[parts.length - 1] || name;
}

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("season") ?? undefined;
  const season = parseSeason(raw, currentDataSeason());
  const era = eraForSeason(season);
  const fonts = await loadEraFonts(era);

  const [rows, colors] = await Promise.all([getSeasonManagers(season), loadTeamColors()]);
  const managers: ManagerCard[] = (rows ?? []).slice(0, 3).map((r) => ({
    name: surname(r.name),
    initials: initials(r.name),
    photoUrl: photoUrl(r.photo),
    clubColor: colors?.[String(r.teamId)]?.home ?? "#888888",
    ppg: r.record.ppg.toFixed(2),
  }));

  const el = renderManagersCard({ era, seasonLabel: formatSeasonLabel(season), managers });
  const size = { width: 1200, height: 630 } as const;
  // Modern era ships no custom fonts — OMIT `fonts` (passing `[]` disables them).
  return new ImageResponse(el, fonts.length > 0 ? { ...size, fonts } : size);
}
