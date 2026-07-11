import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/navigation";

import type { Fixture, FixtureTeam } from "@/types/api";
import { cn } from "@/utils/cn";
import { localizeDigits } from "@/utils/format";
import { revealProps } from "@/utils/reveal";
import { withSeason } from "@/utils/season";

export type FixtureListItem = {
  fixture: Fixture;
  /** Optional catalyst label (TASK-M14 Classic Matches), e.g. "7-Goal Thriller". */
  badge?: string;
};

type Props = {
  items: readonly FixtureListItem[];
  // Viewing season — preserved on the team links (TASK-M09). The fixture link
  // derives its own season from the fixture id, so it stays bare.
  season: number;
  // Accessible name for the list (e.g. "Classic matches" / "Recent results").
  ariaLabel: string;
  // Shown in the empty state.
  emptyMessage?: string;
};

// Phase 15 redesign (TASK-1504): the dashboard's "Fixtures" tile renders results
// as a compact vertical list — home team flush to the LEFT edge, away team flush
// to the RIGHT edge, and the score centred in its own fixed column so every row's
// score lines up. Three sibling links per row (home → team, score → match, away →
// team) so there are no nested anchors.
export function FixtureList({ items, season, ariaLabel, emptyMessage }: Props) {
  // Isomorphic hooks — work in this sync Server Component (TASK-1603).
  const t = useTranslations("fixtures");
  const locale = useLocale();
  if (items.length === 0) {
    return (
      <p className="text-muted-foreground px-1 py-6 text-sm" role="status">
        {emptyMessage ?? t("noMatches")}
      </p>
    );
  }

  return (
    <ul className="divide-border divide-y" aria-label={ariaLabel}>
      {items.map(({ fixture: fx, badge }, i) => (
        <li key={fx.fixture.id} className="py-2.5 first:pt-0 last:pb-0" {...revealProps(i)}>
          {badge && (
            <span className="bg-primary/10 text-primary mb-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase">
              {badge}
            </span>
          )}
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <TeamSide team={fx.teams.home} season={season} dim={fx.teams.home.winner === false} />
            <Link
              href={`/fixtures/${fx.fixture.id}`}
              aria-label={t("matchDetails", {
                home: fx.teams.home.name,
                away: fx.teams.away.name,
              })}
              className="focus-visible:ring-ring rounded px-2 text-center text-sm font-bold tabular-nums hover:underline focus-visible:ring-2 focus-visible:outline-none"
            >
              {localizeDigits(fx.goals.home ?? "—", locale)}–
              {localizeDigits(fx.goals.away ?? "—", locale)}
            </Link>
            <TeamSide
              team={fx.teams.away}
              season={season}
              dim={fx.teams.away.winner === false}
              reverse
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function TeamSide({
  team,
  season,
  dim,
  reverse,
}: {
  team: FixtureTeam;
  season: number;
  dim?: boolean;
  reverse?: boolean;
}) {
  const tc = useTranslations("common");
  return (
    <Link
      href={withSeason(`/teams/${team.id}`, season)}
      aria-label={tc("viewTeamPage", { team: team.name })}
      className={cn(
        "focus-visible:ring-ring flex min-w-0 items-center gap-2 rounded hover:underline focus-visible:ring-2 focus-visible:outline-none",
        reverse && "flex-row-reverse",
      )}
    >
      <Image
        src={team.logo}
        alt=""
        width={20}
        height={20}
        className="size-5 shrink-0 object-contain"
        unoptimized
      />
      <span className={cn("truncate text-sm font-medium", dim && "text-muted-foreground")}>
        {team.name}
      </span>
    </Link>
  );
}
