import { useTranslations } from "next-intl";
import { Eye, Repeat, Square, Target, type LucideIcon } from "lucide-react";
import { Link } from "@/i18n/navigation";

import type { FixtureEvent } from "@/types/api";
import { cn } from "@/utils/cn";
import { withSeason } from "@/utils/season";

type IconConfig = {
  Icon: LucideIcon;
  // Message key in the `fixtures` namespace for the icon's aria-label.
  labelKey: string;
  className?: string;
};

function iconFor(ev: FixtureEvent): IconConfig {
  if (ev.type === "Goal") {
    return { Icon: Target, labelKey: "evtGoal", className: "text-emerald-500" };
  }
  if (ev.type === "Card") {
    if (ev.detail === "Yellow Card") {
      return {
        Icon: Square,
        labelKey: "evtYellowCard",
        className: "fill-yellow-400 text-yellow-500",
      };
    }
    return {
      Icon: Square,
      labelKey: "evtRedCard",
      className: "fill-red-500 text-red-600",
    };
  }
  if (ev.type === "subst") {
    return { Icon: Repeat, labelKey: "evtSubstitution", className: "text-blue-500" };
  }
  return { Icon: Eye, labelKey: "evtVar", className: "text-purple-500" };
}

function formatMinute(time: FixtureEvent["time"]): string {
  if (time.extra != null) return `${time.elapsed}+${time.extra}'`;
  return `${time.elapsed}'`;
}

function PlayerLabel({ ev, season }: { ev: FixtureEvent; season?: number }) {
  const t = useTranslations("fixtures");
  return (
    <span className="min-w-0 truncate text-sm">
      {ev.player.id != null && ev.player.name ? (
        <Link href={withSeason(`/players/${ev.player.id}`, season)} className="hover:underline">
          {ev.player.name}
        </Link>
      ) : (
        (ev.player.name ?? t("unknownPlayer"))
      )}
      {ev.assist.name && (
        <span className="text-muted-foreground ms-1 text-xs">
          (
          {ev.assist.id != null ? (
            <Link href={withSeason(`/players/${ev.assist.id}`, season)} className="hover:underline">
              {ev.assist.name}
            </Link>
          ) : (
            ev.assist.name
          )}
          )
        </span>
      )}
    </span>
  );
}

// TASK-1512 ("E01") — centre timeline: home events on the left, away on the
// right, with the minute pinned down the middle.
export function EventTimeline({
  events,
  homeId,
  season,
}: {
  events: readonly FixtureEvent[];
  homeId: number;
  // M21 — carried onto the resolved player/assist links.
  season?: number;
}) {
  const t = useTranslations("fixtures");
  if (events.length === 0) {
    return (
      <p
        role="status"
        aria-label={t("noEvents")}
        className="text-muted-foreground bg-card rounded-md border p-6 text-sm"
      >
        {t("noEvents")}
      </p>
    );
  }

  return (
    <ol className="mx-auto flex max-w-xl flex-col">
      {events.map((ev, idx) => {
        const isHome = ev.team.id === homeId;
        const { Icon, labelKey, className } = iconFor(ev);
        const icon = <Icon aria-label={t(labelKey)} className={cn("size-4 shrink-0", className)} />;
        return (
          <li
            key={`${ev.time.elapsed}-${ev.time.extra ?? "x"}-${ev.player.id ?? "?"}-${idx}`}
            data-side={isHome ? "home" : "away"}
            className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 py-1.5"
          >
            <div className="flex min-w-0 items-center justify-end gap-2 text-end">
              {isHome && (
                <>
                  <PlayerLabel ev={ev} season={season} />
                  {icon}
                </>
              )}
            </div>
            <span
              data-testid="event-minute"
              className="text-muted-foreground bg-card w-11 rounded-full border py-0.5 text-center font-mono text-xs tabular-nums"
            >
              {formatMinute(ev.time)}
            </span>
            <div className="flex min-w-0 items-center gap-2">
              {!isHome && (
                <>
                  {icon}
                  <PlayerLabel ev={ev} season={season} />
                </>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
