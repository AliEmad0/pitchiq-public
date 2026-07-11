import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";

import type { ManagerIndexRow } from "@/features/managers/managers-index.api";
import { seasonHighlights } from "@/features/managers/managers-highlights";
import { localizeDigits } from "@/utils/format";
import { revealProps } from "@/utils/reveal";

/**
 * Four season-highlight KPI tiles above the managers table (TASK-1509) — the
 * leaders in points, wins, win% and PPG. Non-interactive (the table carries the
 * links); names are plain text.
 */
export function ManagerStatHighlights({ rows }: { rows: ManagerIndexRow[] }) {
  const t = useTranslations("managers");
  const locale = useLocale();
  const h = seasonHighlights(rows);
  const tiles: Array<{ label: string; row: ManagerIndexRow | null; value: string }> = [
    { label: t("mostPoints"), row: h.mostPoints, value: String(h.mostPoints?.record.points ?? "") },
    { label: t("mostWins"), row: h.mostWins, value: String(h.mostWins?.record.win ?? "") },
    {
      label: t("bestWinPct"),
      row: h.bestWinPct,
      value: h.bestWinPct ? `${h.bestWinPct.record.winPct.toFixed(0)}%` : "",
    },
    {
      label: t("bestPpg"),
      row: h.bestPpg,
      value: h.bestPpg ? h.bestPpg.record.ppg.toFixed(2) : "",
    },
  ];
  if (tiles.every((tile) => !tile.row)) return null;

  return (
    <section aria-label={t("seasonHighlights")} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {tiles.map((tile, i) =>
        tile.row ? (
          <div key={tile.label} className="bg-card rounded-lg border p-4" {...revealProps(i)}>
            <p className="text-muted-foreground text-xs tracking-wide uppercase">{tile.label}</p>
            <p className="text-primary mt-1 text-3xl font-bold tabular-nums">
              {localizeDigits(tile.value, locale)}
            </p>
            <p className="text-muted-foreground mt-1.5 flex items-center gap-1.5 text-xs">
              {tile.row.teamLogo && (
                <Image
                  src={tile.row.teamLogo}
                  alt=""
                  width={16}
                  height={16}
                  className="size-4 shrink-0 object-contain"
                  unoptimized
                />
              )}
              <span className="truncate">{tile.row.name}</span>
            </p>
          </div>
        ) : null,
      )}
    </section>
  );
}
