"use client";

import { useLocale, useTranslations } from "next-intl";
import { CalendarDays } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSeason } from "@/hooks/useSeason";
import { formatSeasonLabel } from "@/utils/season";

// Shadcn Select bound to the URL's `?season=YYYY` via `useSeason`. Picking
// an option soft-navigates with `shallow: false`, so every Server Component
// downstream re-fetches against the new season. Picking the current season
// drops the param from the URL entirely (clean canonical links).
//
// `seasons` is supplied by the server `<SeasonSwitcherLoader>` from
// `getAvailableSeasons()` (TASK-702) — newest-first — so the dropdown only
// offers seasons that actually have committed data, preventing 404/empty
// states from picking an unsupported year.
export function SeasonSwitcher({ seasons }: { seasons: number[] }) {
  const t = useTranslations("controls");
  const locale = useLocale();
  const [season, setSeason] = useSeason();

  return (
    <Select
      value={String(season)}
      onValueChange={(value) => {
        const next = Number(value);
        if (Number.isInteger(next)) {
          void setSeason(next);
        }
      }}
    >
      {/* Phase 15 redesign: a filled "season chip" — a magenta calendar glyph +
          the season label. Sits far-right in the header after the theme toggle. */}
      <SelectTrigger
        aria-label={t("season")}
        className="ix-glow h-9 gap-1.5 rounded-lg border-transparent bg-secondary px-2.5 text-xs font-medium tabular-nums hover:bg-accent"
      >
        <CalendarDays className="size-4 text-primary" aria-hidden />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {seasons.map((s) => (
          <SelectItem key={s} value={String(s)} className="text-xs tabular-nums">
            {formatSeasonLabel(s, locale)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
