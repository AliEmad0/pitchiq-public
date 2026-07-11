import { useLocale, useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";

import type { FixtureStatBlock, FixtureStatRow, FixtureStatValue, FixtureTeams } from "@/types/api";
import { cn } from "@/utils/cn";
import { localizeDigits } from "@/utils/format";

// The 6 synthesized stat types (from `synthesizeStatistics`) → message keys.
// The English `type` stays the join/React key; only the DISPLAYED label is
// translated.
const STAT_TYPE_KEY: Record<string, string> = {
  Shots: "statShots",
  "Shots on Goal": "statShotsOnGoal",
  "Corner Kicks": "statCorners",
  Fouls: "statFouls",
  "Yellow Cards": "statYellowCards",
  "Red Cards": "statRedCards",
};

function asNumber(v: FixtureStatValue): number | null {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const trimmed = v.endsWith("%") ? v.slice(0, -1) : v;
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function formatValue(v: FixtureStatValue, locale: string): string {
  if (v === null) return "—";
  // localizeDigits transliterates only the digits (a trailing "%" is preserved).
  return localizeDigits(String(v), locale);
}

// TASK-1512 ("S17") — win arrows: each stat shows both values with an arrow
// pointing to the higher one, and that side's value in the era accent.
export function StatComparison({
  statistics,
  fixtureTeams,
}: {
  statistics: FixtureStatBlock[];
  fixtureTeams: FixtureTeams;
}) {
  const t = useTranslations("fixtures");
  const locale = useLocale();
  if (statistics.length === 0) {
    return (
      <p role="status" className="text-muted-foreground bg-card rounded-md border p-6 text-sm">
        {t("statsPending")}
      </p>
    );
  }

  const homeBlock = statistics.find((b) => b.team.id === fixtureTeams.home.id);
  const awayBlock = statistics.find((b) => b.team.id !== fixtureTeams.home.id);

  if (!homeBlock || !awayBlock) {
    return (
      <p role="status" className="text-muted-foreground bg-card rounded-md border p-6 text-sm">
        {t("statsMissingSide")}
      </p>
    );
  }

  return (
    <ul className="bg-card mx-auto max-w-lg divide-y rounded-md border">
      {homeBlock.statistics.map((homeStat) => {
        const awayStat = awayBlock.statistics.find((s) => s.type === homeStat.type);
        const key = STAT_TYPE_KEY[homeStat.type];
        return (
          <StatRow
            key={homeStat.type}
            label={key ? t(key) : homeStat.type}
            home={homeStat}
            away={awayStat ?? { type: homeStat.type, value: null }}
            locale={locale}
          />
        );
      })}
    </ul>
  );
}

function StatRow({
  label,
  home,
  away,
  locale,
}: {
  label: string;
  home: FixtureStatRow;
  away: FixtureStatRow;
  locale: string;
}) {
  const homeNum = asNumber(home.value);
  const awayNum = asNumber(away.value);
  const homeWin = homeNum != null && awayNum != null && homeNum > awayNum;
  const awayWin = homeNum != null && awayNum != null && awayNum > homeNum;

  return (
    <li className="grid grid-cols-[2.5rem_1.25rem_1fr_1.25rem_2.5rem] items-center gap-1.5 px-4 py-2.5">
      <span
        className={cn(
          "text-end font-mono text-base tabular-nums",
          homeWin && "text-primary font-bold",
        )}
      >
        {formatValue(home.value, locale)}
      </span>
      <span className="text-primary flex justify-center">
        {homeWin && <ChevronLeft className="size-4 rtl:-scale-x-100" aria-hidden />}
      </span>
      <span className="text-muted-foreground text-center text-xs tracking-wide uppercase">
        {label}
      </span>
      <span className="text-primary flex justify-center">
        {awayWin && <ChevronRight className="size-4 rtl:-scale-x-100" aria-hidden />}
      </span>
      <span
        className={cn(
          "text-start font-mono text-base tabular-nums",
          awayWin && "text-primary font-bold",
        )}
      >
        {formatValue(away.value, locale)}
      </span>
    </li>
  );
}
