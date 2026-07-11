import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/navigation";

import type { ClubLogosFile, PlayerSeasonSplit } from "@/data/schemas";
import { clubLogoFromMap } from "@/utils/club-logo";
import { localizeDigits } from "@/utils/format";
import { revealProps } from "@/utils/reveal";
import { withSeason } from "@/utils/season";

// TASK-M07: per-club breakdown for a mid-season transferee, rendered below the
// season-stats grid on `/players/[id]`. The aggregate cards above already show
// the season total; this shows how it splits across the clubs (primary first).
// Returns null for a single-club season (no splits) so the page can render it
// unconditionally. Each club links to its team page for the viewed season
// (TASK-M07b).
export function PlayerSeasonSplits({
  splits,
  season,
  clubLogos = null,
}: {
  splits: PlayerSeasonSplit[];
  season: number;
  // Era-correct crests (TASK-M54); omitted → the current crest.
  clubLogos?: ClubLogosFile | null;
}) {
  const t = useTranslations("players");
  const locale = useLocale();
  if (splits.length === 0) return null;

  // Column label keys (localized via the `players` catalog, TASK-1603).
  const cols: Array<{ key: keyof PlayerSeasonSplit; labelKey: string }> = [
    { key: "appearances", labelKey: "apps" },
    { key: "goals", labelKey: "sortGoals" },
    { key: "assists", labelKey: "sortAssists" },
    { key: "yellowCards", labelKey: "splitYellow" },
    { key: "redCards", labelKey: "splitRed" },
  ];

  return (
    <section aria-label={t("perClubBreakdown")} className="space-y-3" {...revealProps()}>
      <h2 className="text-xl font-semibold tracking-tight">{t("byClubThisSeason")}</h2>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="text-muted-foreground border-b text-xs tracking-wide uppercase">
            <tr>
              <th className="px-4 py-2 text-start font-medium">{t("club")}</th>
              {cols.map((c) => (
                <th key={c.key} className="px-4 py-2 text-end font-medium">
                  {t(c.labelKey)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {splits.map((s) => (
              <tr key={s.teamId} className="border-b last:border-0">
                <td className="px-4 py-2">
                  <Link
                    href={withSeason(`/teams/${s.teamId}`, season)}
                    className="flex items-center gap-2 hover:underline"
                  >
                    <Image
                      src={clubLogoFromMap(s.teamId, season, clubLogos)}
                      alt={s.teamName}
                      width={20}
                      height={20}
                      className="size-5 shrink-0 object-contain"
                    />
                    <span className="font-medium">{s.teamName}</span>
                  </Link>
                </td>
                {cols.map((c) => (
                  <td key={c.key} className="px-4 py-2 text-end tabular-nums">
                    {s[c.key] == null ? "—" : localizeDigits(s[c.key] as number, locale)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
