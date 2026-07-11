import { ImageResponse } from "next/og";

import { parseId, parseSlotSeason, type SlotSeason } from "@/features/players/comparison-metrics";
import { findPlayerSeasons, loadPlayer } from "@/data/loaders";
import { getPlayerCareer } from "@/features/players/api";
import { eraForSeason } from "@/utils/era";
import { currentDataSeason, formatSeasonLabel, parseSeason } from "@/utils/season";

import { renderCompareCard, type CompareSlot } from "../compare-card";
import { loadEraFonts } from "../ticket";

// Dynamic OG image for `/compare`, themed by `?season=` → era (TASK-M53): a
// "versus poster" of the two picked players. Reads `?a=&b=&sa=&sb=&season=`
// (mirroring the page). Renders a generic "Compare" poster when fewer than two
// players resolve. `contentType` is NOT a valid Route Handler export.
export const runtime = "nodejs";

function surname(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts[parts.length - 1] || name;
}

// Resolve one slot to its poster fields. Mirrors the page's `resolveSlot`:
// a single season via the snapshot loader (the wire `Player` carries no club),
// "all" via the career aggregate + the latest season's club.
async function resolveSlot(id: number, slotSeason: SlotSeason): Promise<CompareSlot | null> {
  if (slotSeason === "all") {
    const career = await getPlayerCareer(id);
    if (!career) return null;
    const info = await findPlayerSeasons(id);
    return {
      surname: surname(career.player.name),
      club: info?.latest.teamName ?? "",
      label: `Career ${career.span.from}–${career.span.to}`,
      goals: career.metrics.goals ?? 0,
      assists: career.metrics.assists ?? 0,
    };
  }
  const p = await loadPlayer(id, slotSeason);
  if (!p) return null;
  return {
    surname: surname(p.name),
    club: p.teamName,
    label: formatSeasonLabel(slotSeason),
    goals: p.metrics.goals ?? 0,
    assists: p.metrics.assists ?? 0,
  };
}

export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams;
  const season = parseSeason(sp.get("season") ?? undefined, currentDataSeason());
  const era = eraForSeason(season);
  const fonts = await loadEraFonts(era);

  const aId = parseId(sp.get("a") ?? undefined);
  const bId = parseId(sp.get("b") ?? undefined);
  const sa = parseSlotSeason(sp.get("sa") ?? undefined, season);
  const sb = parseSlotSeason(sp.get("sb") ?? undefined, season);

  let a: CompareSlot | null = null;
  let b: CompareSlot | null = null;
  if (aId !== null && bId !== null) {
    [a, b] = await Promise.all([resolveSlot(aId, sa), resolveSlot(bId, sb)]);
  }

  const el = renderCompareCard({ era, seasonLabel: formatSeasonLabel(season), a, b });
  const size = { width: 1200, height: 630 } as const;
  // Modern era ships no custom fonts — OMIT `fonts` (passing `[]` disables them).
  return new ImageResponse(el, fonts.length > 0 ? { ...size, fonts } : size);
}
