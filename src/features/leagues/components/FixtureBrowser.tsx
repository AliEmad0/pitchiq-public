"use client";

import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { CalendarDays, Search } from "lucide-react";
import { useState } from "react";

import { Card } from "@/components/ui/card";
import type { FixtureDayGroup } from "@/features/leagues/fixtures-by-day";
import type { Fixture, FixtureTeam } from "@/types/api";
import { cn } from "@/utils/cn";
import { localizeDigits } from "@/utils/format";
import { revealProps } from "@/utils/reveal";
import { withSeason } from "@/utils/season";

/** Total goals for a completed match with ≥4 goals (TASK-1511, #17), else null. */
function goalFestTotal(fx: Fixture): number | null {
  const h = fx.goals.home;
  const a = fx.goals.away;
  if (h === null || a === null) return null;
  const total = h + a;
  return total >= 4 ? total : null;
}

/**
 * Client island for the all-fixtures page (TASK-1511 "#23"): a rounded pill
 * filter (by club) over big-score fixture cards, grouped by matchday. The
 * server passes the matchdays already newest-first (TASK-M36) + a per-club
 * accent colour for each card's top edge.
 */
export function FixtureBrowser({
  groups,
  season,
  accentByTeam,
  totalCount,
}: {
  groups: FixtureDayGroup[];
  season: number;
  accentByTeam: Record<number, string | null>;
  totalCount: number;
}) {
  const t = useTranslations("fixtures");
  const locale = useLocale();
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();
  const filtered = needle
    ? groups
        .map((g) => ({
          ...g,
          fixtures: g.fixtures.filter(
            (fx) =>
              fx.teams.home.name.toLowerCase().includes(needle) ||
              fx.teams.away.name.toLowerCase().includes(needle),
          ),
        }))
        .filter((g) => g.fixtures.length > 0)
    : groups;
  const shown = filtered.reduce((n, g) => n + g.fixtures.length, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search
            className="text-muted-foreground absolute top-1/2 left-3.5 size-4 -translate-y-1/2"
            aria-hidden
          />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("filterByClub")}
            aria-label={t("filterByClubAria")}
            className="ix-glow bg-card focus-visible:ring-ring h-10 w-72 max-w-full rounded-full border pe-4 ps-10 text-sm focus-visible:ring-2 focus-visible:outline-none"
          />
        </div>
        <span className="text-muted-foreground text-xs tabular-nums">
          {t("matchesCount", {
            shown: localizeDigits(shown, locale),
            total: localizeDigits(totalCount, locale),
          })}
        </span>
      </div>

      {filtered.length === 0 ? (
        <p role="status" className="text-muted-foreground bg-card rounded-md border p-6 text-sm">
          {t("noMatchesFor", { q: q.trim() })}
        </p>
      ) : (
        filtered.map((group) => (
          <section key={group.key} aria-label={group.heading} {...revealProps()}>
            <h2 className="text-muted-foreground mb-3 flex items-center gap-2 text-sm font-semibold">
              <CalendarDays className="size-4" aria-hidden />
              {group.heading}
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {group.fixtures.map((fx, i) => (
                <FixtureBigCard
                  key={fx.fixture.id}
                  fx={fx}
                  season={season}
                  accent={accentByTeam[fx.teams.home.id] ?? null}
                  revealIndex={i}
                />
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}

function FixtureBigCard({
  fx,
  season,
  accent,
  revealIndex,
}: {
  fx: Fixture;
  season: number;
  accent: string | null;
  revealIndex: number;
}) {
  const t = useTranslations("fixtures");
  const locale = useLocale();
  const hs = fx.goals.home;
  const as = fx.goals.away;
  const showScore = hs !== null && as !== null;
  const homeDim = showScore && (as as number) > (hs as number);
  const awayDim = showScore && (hs as number) > (as as number);
  const thrillerTotal = goalFestTotal(fx);

  return (
    <li className="min-w-0" {...revealProps(revealIndex)}>
      <Card
        // ix-glow (TASK-1705): the inline borderTopColor wins over the hover
        // border tint, so the club accent edge is unaffected.
        className="ix-glow relative gap-0 overflow-hidden border-t-[3px] p-4"
        style={{ borderTopColor: accent ?? "var(--primary)" }}
      >
        {thrillerTotal !== null && (
          <span className="bg-primary/10 text-primary relative z-[1] mb-2 inline-block self-start rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase">
            {t("goalThriller", {
              total: thrillerTotal,
              totalFmt: localizeDigits(thrillerTotal, locale),
            })}
          </span>
        )}
        <Link
          href={`/fixtures/${fx.fixture.id}`}
          aria-label={t("matchDetails", { home: fx.teams.home.name, away: fx.teams.away.name })}
          className="focus-visible:ring-ring absolute inset-0 focus-visible:ring-2 focus-visible:outline-none"
        />
        <div className="flex items-center justify-between gap-2">
          <TeamCol team={fx.teams.home} season={season} align="right" dim={homeDim} />
          <span className="shrink-0 px-2 text-2xl font-bold tabular-nums">
            {showScore ? (
              localizeDigits(`${hs}–${as}`, locale)
            ) : (
              <span className="text-muted-foreground text-sm">{t("vs")}</span>
            )}
          </span>
          <TeamCol team={fx.teams.away} season={season} align="left" dim={awayDim} />
        </div>
      </Card>
    </li>
  );
}

function TeamCol({
  team,
  season,
  align,
  dim,
}: {
  team: FixtureTeam;
  season: number;
  align: "left" | "right";
  dim: boolean;
}) {
  const tc = useTranslations("common");
  return (
    <Link
      href={withSeason(`/teams/${team.id}`, season)}
      aria-label={tc("viewTeamPage", { team: team.name })}
      className={cn(
        "focus-visible:ring-ring relative z-[1] flex min-w-0 flex-1 items-center gap-2 rounded hover:underline focus-visible:ring-2 focus-visible:outline-none",
        align === "right" && "flex-row-reverse text-end",
      )}
    >
      <Image
        src={team.logo}
        alt=""
        width={28}
        height={28}
        className="size-7 shrink-0 object-contain"
        unoptimized
      />
      <span
        className={cn("truncate text-sm font-semibold", dim && "text-muted-foreground font-medium")}
      >
        {team.name}
      </span>
    </Link>
  );
}
