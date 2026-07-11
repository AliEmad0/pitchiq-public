import { useLocale, useTranslations } from "next-intl";

import { localizeDigits } from "@/utils/format";
import Image from "next/image";
import { Link } from "@/i18n/navigation";

import { Card } from "@/components/ui/card";
import { Flag } from "@/features/players/components/Flag";
import { PlayerImage } from "@/features/players/components/PlayerImage";
import type { PlayerIndexRow } from "@/features/players/players-index.api";
import { revealProps } from "@/utils/reveal";
import { withSeason } from "@/utils/season";

/**
 * Showcase of the season's most valuable players (top 8 by goals+assists) —
 * TASK-1507 "accent-edge cards": each card is a club-colour top edge + a
 * full-height portrait photo (4:5) + the player's headline stats. The accent
 * hex comes from the row's curated kit colour, falling back to the era
 * `--primary` so it re-skins per era.
 */
export function TopPlayersStrip({ rows, season }: { rows: PlayerIndexRow[]; season: number }) {
  const t = useTranslations("players");
  const locale = useLocale();
  const top = rows.slice(0, 8);
  if (top.length === 0) return null;
  return (
    <section aria-label={t("mostValuable")} className="space-y-3">
      <h2 className="flex items-center gap-2 text-sm font-semibold tracking-tight">
        <span aria-hidden className="bg-primary inline-block h-3.5 w-[3px] rounded-full" />
        {t("mostValuable")}
      </h2>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {top.map((r, i) => (
          <li key={r.id} {...revealProps(i)}>
            <Card
              className="flex flex-row items-stretch gap-0 overflow-hidden border-t-[3px] p-0"
              style={{ borderTopColor: r.teamColor ?? "var(--primary)" }}
            >
              <div className="bg-muted relative w-24 shrink-0 self-stretch overflow-hidden rounded-e-xl sm:w-28">
                <PlayerImage
                  player={{ name: r.name, photo: r.photo }}
                  size="lg"
                  className="size-full rounded-none object-cover"
                />
                <span className="absolute top-1.5 left-1.5 rounded bg-black/40 px-1.5 text-[10px] font-bold tabular-nums text-white">
                  #{i + 1}
                </span>
              </div>
              <div className="flex min-w-0 flex-col justify-center gap-1 px-3 py-2">
                <p className="flex items-center gap-1.5">
                  <Link
                    href={withSeason(`/players/${r.id}`, season)}
                    className="truncate font-semibold hover:underline"
                  >
                    {r.name}
                  </Link>
                  <Flag code={r.nationalityCode} name={r.nationality} />
                </p>
                <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
                  {r.teamLogo && (
                    <Image
                      src={r.teamLogo}
                      alt=""
                      width={14}
                      height={14}
                      className="size-3.5 shrink-0 object-contain"
                      unoptimized
                    />
                  )}
                  <span className="truncate">{r.teamName}</span>
                </p>
                <p className="mt-0.5 text-xs tabular-nums">
                  <span className="text-primary text-sm font-bold">
                    {localizeDigits(r.contributions, locale)}
                  </span>{" "}
                  {t("gaAbbr")}
                  <span className="text-muted-foreground">
                    {" "}
                    {t("statSubline", {
                      goals: r.goals,
                      assists: r.assists,
                      appearances: r.appearances,
                      goalsFmt: localizeDigits(r.goals, locale),
                      assistsFmt: localizeDigits(r.assists, locale),
                      appsFmt: localizeDigits(r.appearances, locale),
                    })}
                  </span>
                </p>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}
