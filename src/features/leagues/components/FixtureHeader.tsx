import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/navigation";

import { Badge } from "@/components/ui/badge";
import type { Fixture } from "@/types/api";
import { cn } from "@/utils/cn";
import { formatNumber, localizeDigits } from "@/utils/format";
import { formatKickoff } from "@/utils/format-kickoff";
import { revealProps } from "@/utils/reveal";
import { seasonFromFixtureId, withSeason } from "@/utils/season";

const LIVE_STATUSES = new Set(["1H", "2H", "HT", "ET", "P", "BT"]);
const COMPLETED_STATUSES = new Set(["FT", "AET", "PEN", "AWD"]);

function statusLabel(short: string, elapsed: number | null, notStarted: string): string {
  if (LIVE_STATUSES.has(short)) return `${short} · ${elapsed ?? 0}'`;
  if (COMPLETED_STATUSES.has(short)) return short;
  if (short === "NS") return notStarted;
  return short;
}

function statusVariant(short: string): "default" | "secondary" | "outline" {
  if (LIVE_STATUSES.has(short)) return "default";
  if (COMPLETED_STATUSES.has(short)) return "secondary";
  return "outline";
}

export function FixtureHeader({ fixture: fx }: { fixture: Fixture }) {
  const t = useTranslations("fixtures");
  const locale = useLocale();
  const showScore = fx.goals.home !== null && fx.goals.away !== null;
  const kickoff = formatKickoff(fx.fixture.date, locale);
  // Carry the fixture's own season on the team links (TASK-M09) so they open
  // that season's team page. Derived from the fixture id's date.
  const season = seasonFromFixtureId(String(fx.fixture.id));

  // TASK-M16: "Attendance 73,297 · Old Trafford" — omit either half when null,
  // omit the whole line when both are absent. The number is locale-formatted
  // (Western digits, bidi-isolated in RTL — TASK-1605).
  const attendance = fx.fixture.attendance ?? null;
  const attendanceText =
    attendance !== null ? t("attendance", { count: formatNumber(attendance, locale) }) : "";
  const venueLine = [attendanceText, fx.fixture.venue.name].filter(Boolean).join(" · ");

  return (
    <header className="rounded-lg border bg-card p-4 lg:p-6" {...revealProps()}>
      <div className="flex items-center justify-between gap-3 lg:gap-6">
        <TeamSide team={fx.teams.home} align="right" season={season} />
        <div className="flex shrink-0 flex-col items-center gap-1">
          <div
            className="text-3xl font-bold tabular-nums lg:text-5xl"
            // TASK-1512 — the score glows in the era accent (`--primary`).
            style={
              showScore
                ? { textShadow: "0 0 18px var(--primary), 0 0 5px var(--primary)" }
                : undefined
            }
          >
            {showScore ? localizeDigits(`${fx.goals.home} – ${fx.goals.away}`, locale) : t("vs")}
          </div>
          {fx.score.halftime.home !== null && fx.score.halftime.away !== null && (
            <span className="text-xs tabular-nums text-muted-foreground">
              {t("halfTime", {
                home: localizeDigits(fx.score.halftime.home, locale),
                away: localizeDigits(fx.score.halftime.away, locale),
              })}
            </span>
          )}
          <Badge variant={statusVariant(fx.fixture.status.short)}>
            {localizeDigits(
              statusLabel(
                fx.fixture.status.short,
                fx.fixture.status.elapsed,
                t("statusNotStarted"),
              ),
              locale,
            )}
          </Badge>
        </div>
        <TeamSide team={fx.teams.away} align="left" season={season} />
      </div>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        {kickoff}
        {fx.fixture.referee ? ` · ${t("referee", { name: fx.fixture.referee })}` : ""}
      </p>
      {venueLine && <p className="mt-1 text-center text-xs text-muted-foreground">{venueLine}</p>}
    </header>
  );
}

function TeamSide({
  team,
  align,
  season,
}: {
  team: Fixture["teams"]["home"];
  align: "left" | "right";
  season: number | null;
}) {
  const tc = useTranslations("common");
  return (
    <Link
      href={withSeason(`/teams/${team.id}`, season)}
      aria-label={tc("viewTeamPage", { team: team.name })}
      className={cn(
        "focus-visible:ring-ring flex min-w-0 flex-1 items-center gap-3 rounded hover:underline focus-visible:ring-2 focus-visible:outline-none",
        align === "right" && "flex-row-reverse text-end",
      )}
    >
      <Image
        src={team.logo}
        alt=""
        width={56}
        height={56}
        className="size-10 shrink-0 object-contain lg:size-14"
        unoptimized
      />
      <span className="truncate text-base font-semibold lg:text-xl">{team.name}</span>
    </Link>
  );
}
