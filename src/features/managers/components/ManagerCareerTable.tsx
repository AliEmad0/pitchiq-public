import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/navigation";

import type { ManagerClubRow } from "@/features/managers/manager-profile.api";
import { cn } from "@/utils/cn";
import { bidiIsolate, isRtl, localizeDigits } from "@/utils/format";
import { revealProps } from "@/utils/reveal";
import { formatSeasonLabel, withSeason } from "@/utils/season";

/**
 * A manager's career broken down by club (TASK-M49 → TASK-1510 responsive
 * redesign): a full table on desktop (`md:`), and a card-per-club list on mobile
 * (the 9-column table is unreadable at 375px). Aggregate P/W/D/L/Pts per club +
 * seasons span; the viewed-season clubs are highlighted; club crest → team page.
 */
export function ManagerCareerTable({
  byClub,
  season,
  highlightSeason,
}: {
  byClub: ManagerClubRow[];
  season: number;
  highlightSeason: number | null;
}) {
  const t = useTranslations("managers");
  const locale = useLocale();
  const isCurrent = (c: ManagerClubRow) =>
    highlightSeason !== null && c.seasons.includes(highlightSeason);
  // Season span for the club. English: full labels bidi-isolated as one unit
  // ("2019-20–2025-26"). Arabic: a COMPACT year range "٢٠١٩–٢٠٢٦" (first start →
  // last end year) — a full spaced label at each end ("٢٠١٩ - ٢٠٢٠") joined by a
  // dash reads as a muddled 4-number cluster; the compact range flows RTL cleanly
  // (year-first when read, NOT isolated — the season-label RTL-flow rule).
  const fmtSpan = (c: ManagerClubRow) => {
    const min = Math.min(...c.seasons);
    const max = Math.max(...c.seasons);
    const multi = c.seasons.length > 1;
    if (isRtl(locale)) {
      return multi ? localizeDigits(`${min}–${max + 1}`, locale) : formatSeasonLabel(min, locale);
    }
    return bidiIsolate(
      formatSeasonLabel(min) + (multi ? `–${formatSeasonLabel(max)}` : ""),
      locale,
    );
  };
  const fmtGd = (gd: number) => (gd > 0 ? `+${gd}` : String(gd));
  const clubLink = (c: ManagerClubRow, className: string) => (
    <Link href={withSeason(`/teams/${c.teamId}`, season)} className={className}>
      {c.teamLogo && (
        <Image
          src={c.teamLogo}
          alt=""
          width={20}
          height={20}
          className="size-5 shrink-0 object-contain"
          unoptimized
        />
      )}
      <span className="truncate">{c.teamName}</span>
    </Link>
  );

  return (
    <section
      aria-label={t("careerByClub")}
      className="bg-card rounded-lg border p-4 lg:p-6"
      {...revealProps()}
    >
      <h2 className="mb-3 text-sm font-semibold tracking-tight">{t("careerByClub")}</h2>

      {/* Desktop: full table. */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead className="text-muted-foreground text-xs">
            <tr>
              <th className="px-2 py-2 text-start">{t("colClub")}</th>
              <th className="px-2 py-2 text-start">{t("colSeasons")}</th>
              <th className="px-2 py-2 text-end">{t("colP")}</th>
              <th className="px-2 py-2 text-end">{t("colW")}</th>
              <th className="px-2 py-2 text-end">{t("colD")}</th>
              <th className="px-2 py-2 text-end">{t("colL")}</th>
              <th className="px-2 py-2 text-end">{t("colGd")}</th>
              <th className="px-2 py-2 text-end font-semibold">{t("colPts")}</th>
              <th className="px-2 py-2 text-end">{t("ppg")}</th>
            </tr>
          </thead>
          <tbody>
            {byClub.map((c) => (
              <tr key={c.teamId} className={cn("border-t", isCurrent(c) && "bg-primary/5")}>
                <td className="px-2 py-2">
                  {clubLink(c, "flex items-center gap-2 hover:underline")}
                </td>
                <td className="text-muted-foreground px-2 py-2">{fmtSpan(c)}</td>
                <td className="px-2 py-2 text-end tabular-nums">
                  {localizeDigits(c.record.played, locale)}
                </td>
                <td className="px-2 py-2 text-end tabular-nums">
                  {localizeDigits(c.record.win, locale)}
                </td>
                <td className="px-2 py-2 text-end tabular-nums">
                  {localizeDigits(c.record.draw, locale)}
                </td>
                <td className="px-2 py-2 text-end tabular-nums">
                  {localizeDigits(c.record.loss, locale)}
                </td>
                <td className="px-2 py-2 text-end tabular-nums">
                  {localizeDigits(fmtGd(c.record.gd), locale)}
                </td>
                <td className="px-2 py-2 text-end font-semibold tabular-nums">
                  {localizeDigits(c.record.points, locale)}
                </td>
                <td className="px-2 py-2 text-end tabular-nums">
                  {localizeDigits(c.record.ppg.toFixed(2), locale)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: a card per club. */}
      <ul className="space-y-2.5 md:hidden">
        {byClub.map((c) => (
          <li key={c.teamId}>
            <div
              className={cn(
                "rounded-lg border p-3",
                isCurrent(c) ? "border-primary/40 bg-primary/5" : "bg-background",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                {clubLink(c, "flex min-w-0 items-center gap-2 font-semibold hover:underline")}
                <span className="text-primary shrink-0 text-base font-bold tabular-nums">
                  {localizeDigits(c.record.points, locale)}
                  <span className="text-muted-foreground ms-1 text-xs font-normal">
                    {t("ptsSuffix")}
                  </span>
                </span>
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                {t("careerSubline", {
                  span: fmtSpan(c),
                  ppg: localizeDigits(c.record.ppg.toFixed(2), locale),
                })}
              </p>
              <dl className="mt-2.5 grid grid-cols-5 gap-1 text-center">
                {(
                  [
                    ["P", c.record.played],
                    ["W", c.record.win],
                    ["D", c.record.draw],
                    ["L", c.record.loss],
                    ["GD", fmtGd(c.record.gd)],
                  ] as const
                ).map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-muted-foreground text-[10px] tracking-wide uppercase">
                      {label}
                    </dt>
                    <dd className="text-sm font-semibold tabular-nums">
                      {localizeDigits(value, locale)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
