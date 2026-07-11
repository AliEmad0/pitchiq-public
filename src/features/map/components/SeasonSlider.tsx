"use client";

import { useLocale, useTranslations } from "next-intl";
import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { localizeDigits } from "@/utils/format";
import { prefersReducedMotion } from "@/utils/motion";
import { formatSeasonLabel } from "@/utils/season";

// Presentational timeline control (the parent owns season + onSeason) plus a
// self-contained ▶ autoplay that advances one season/sec to the end. Reduced
// motion hides autoplay; the slider still works.
export function SeasonSlider({
  seasons,
  season,
  activeCount,
  onSeason,
}: {
  seasons: number[]; // ascending
  season: number;
  activeCount: number;
  onSeason: (season: number) => void;
}) {
  const t = useTranslations("map");
  const locale = useLocale();
  const index = Math.max(0, seasons.indexOf(season));
  const [playing, setPlaying] = useState(false);
  const reduced = prefersReducedMotion();

  const onSeasonRef = useRef(onSeason);
  onSeasonRef.current = onSeason;
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      const i = seasons.indexOf(season);
      if (i >= seasons.length - 1) {
        setPlaying(false);
        return;
      }
      onSeasonRef.current(seasons[i + 1]);
    }, 1000);
    return () => clearInterval(id);
  }, [playing, season, seasons]);

  // TASK-1515 (concept #30 letterbox): the big season number leads on the left,
  // then the magenta play button, then the accent-coloured range; first · active
  // count · last sit beneath the track.
  return (
    <div className="flex flex-wrap items-center gap-4">
      <span className="text-primary shrink-0 text-2xl font-bold tabular-nums sm:text-3xl">
        {formatSeasonLabel(season, locale)}
      </span>
      {!reduced && (
        <button
          type="button"
          onClick={() => {
            // Starting from the newest season replays from the oldest (owner
            // request) — otherwise autoplay is already at the end and does
            // nothing. Only when starting (not pausing).
            if (!playing && seasons.indexOf(season) >= seasons.length - 1) {
              onSeason(seasons[0]);
            }
            setPlaying((p) => !p);
          }}
          aria-pressed={playing}
          aria-label={playing ? t("pauseTimeline") : t("playHistory")}
          className="ix-glow ix-press bg-primary text-primary-foreground flex size-10 shrink-0 items-center justify-center rounded-full hover:opacity-90"
        >
          {playing ? (
            <Pause className="size-4" aria-hidden />
          ) : (
            // Points toward the direction of travel; mirror it in RTL where the
            // timeline runs oldest-on-the-right → newest-on-the-left.
            <Play className="size-4 translate-x-px rtl:-scale-x-100" aria-hidden />
          )}
        </button>
      )}
      <div className="min-w-[180px] flex-1">
        <input
          type="range"
          min={0}
          max={seasons.length - 1}
          step={1}
          value={index}
          aria-label={t("seasonTimeline")}
          aria-valuetext={formatSeasonLabel(season, locale)}
          onChange={(e) => onSeason(seasons[Number(e.target.value)])}
          className="accent-primary w-full"
        />
        <div className="text-muted-foreground mt-1.5 flex justify-between gap-2 text-xs tabular-nums">
          <span>{formatSeasonLabel(seasons[0], locale)}</span>
          <span>{t("clubsActive", { count: localizeDigits(activeCount, locale) })}</span>
          <span>{formatSeasonLabel(seasons[seasons.length - 1], locale)}</span>
        </div>
      </div>
    </div>
  );
}
