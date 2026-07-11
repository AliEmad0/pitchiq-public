import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/navigation";

import { Card, CardContent } from "@/components/ui/card";
import type { Fixture, FixtureTeam } from "@/types/api";
import { cn } from "@/utils/cn";
import { localizeDigits } from "@/utils/format";
import { formatKickoff } from "@/utils/format-kickoff";
import { revealProps } from "@/utils/reveal";
import { withSeason } from "@/utils/season";

export type FixtureCardMode = "next" | "last";

type Props = {
  fixture: Fixture;
  mode: FixtureCardMode;
  // Viewing season — preserved on the team links (TASK-M09). The fixture link
  // derives its own season from the fixture id, so it stays bare.
  season: number;
  // `rail` = fixed-width card in the horizontal dashboard rail; `list` =
  // full-width card in the all-fixtures page grid (TASK-M12).
  variant?: "rail" | "list";
  // Optional contextual catalyst label rendered as a pill (TASK-M14 Classic
  // Matches), e.g. "7-Goal Thriller" / "Title-Race Decider".
  badge?: string;
  // TASK-1704: position within the rail/grid — staggers the soft-rise reveal.
  revealIndex?: number;
};

// One fixture card, shared by <FixturesRail> (the dashboard rails) and the
// all-fixtures page. Server-renderable. `next` mode shows "vs"; `last` shows
// the final score with the losing side dimmed.
//
// Stretched-link pattern: the fixture link's `after:inset-0` overlays the whole
// (relative) card, so clicking any non-team area opens the match. The two team
// links sit ABOVE that overlay via `relative z-[1]`, so they navigate to
// `/teams/[id]` instead. The fixture link and team links are siblings — no
// nested <a>.
export function FixtureCard({
  fixture: fx,
  mode,
  season,
  variant = "rail",
  badge,
  revealIndex = 0,
}: Props) {
  const t = useTranslations("fixtures");
  const locale = useLocale();
  return (
    <li
      className={cn(variant === "rail" ? "min-w-[280px] shrink-0 snap-start" : "min-w-0")}
      {...revealProps(revealIndex)}
    >
      <Card className="ix-glow relative">
        <CardContent className="flex flex-col gap-2 px-4 py-3">
          {badge && (
            <span className="relative z-[1] self-start rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
              {badge}
            </span>
          )}
          <Link
            href={`/fixtures/${fx.fixture.id}`}
            aria-label={t("matchDetails", {
              home: fx.teams.home.name,
              away: fx.teams.away.name,
            })}
            className="text-muted-foreground focus-visible:after:ring-ring text-xs tabular-nums after:absolute after:inset-0 after:rounded-md focus-visible:outline-none focus-visible:after:ring-2"
          >
            <time dateTime={fx.fixture.date}>{formatKickoff(fx.fixture.date, locale)}</time>
          </Link>
          <div className="flex items-center justify-between gap-2">
            <TeamSide
              team={fx.teams.home}
              dim={mode === "last" && fx.teams.home.winner === false}
              season={season}
            />
            <Scoreline mode={mode} goals={fx.goals} />
            <TeamSide
              team={fx.teams.away}
              dim={mode === "last" && fx.teams.away.winner === false}
              season={season}
              reverse
            />
          </div>
        </CardContent>
      </Card>
    </li>
  );
}

function TeamSide({
  team,
  dim,
  reverse,
  season,
}: {
  team: FixtureTeam;
  dim?: boolean;
  reverse?: boolean;
  season: number;
}) {
  const tc = useTranslations("common");
  return (
    <Link
      href={withSeason(`/teams/${team.id}`, season)}
      aria-label={tc("viewTeamPage", { team: team.name })}
      className={cn(
        "focus-visible:ring-ring relative z-[1] flex min-w-0 flex-1 items-center gap-2 rounded hover:underline focus-visible:ring-2 focus-visible:outline-none",
        reverse && "flex-row-reverse",
      )}
    >
      <Image
        src={team.logo}
        alt=""
        width={24}
        height={24}
        className="size-6 shrink-0 object-contain"
        unoptimized
      />
      <span className={cn("truncate text-sm font-medium", dim && "text-muted-foreground")}>
        {team.name}
      </span>
    </Link>
  );
}

function Scoreline({
  mode,
  goals,
}: {
  mode: FixtureCardMode;
  goals: { home: number | null; away: number | null };
}) {
  const t = useTranslations("fixtures");
  const locale = useLocale();
  if (mode === "next") {
    return (
      <span className="px-2 text-xs uppercase tracking-wider text-muted-foreground">{t("vs")}</span>
    );
  }
  const home = goals.home ?? "—";
  const away = goals.away ?? "—";
  return (
    <span
      className="px-2 text-base font-bold tabular-nums"
      aria-label={t("finalScore", { home, away })}
    >
      {localizeDigits(home, locale)}–{localizeDigits(away, locale)}
    </span>
  );
}
