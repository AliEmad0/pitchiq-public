"use client";

import { Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { parseAsString, parseAsStringLiteral, useQueryState } from "nuqs";
import type { CSSProperties } from "react";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { TeamDetail } from "@/types/api";
import { cn } from "@/utils/cn";
import { localizeDigits } from "@/utils/format";
import { revealProps } from "@/utils/reveal";
import { formatSeasonLabel, withSeason } from "@/utils/season";

export type TeamFilterProps = {
  teams: TeamDetail[];
  // Viewing season — preserved on the club links (TASK-M09).
  season: number;
  // Home kit colour (hex) per teamId (TASK-M47 palette) for the card accent +
  // hover ring. Optional so the component stays usable without colours (tests);
  // a club with no colour falls back to the theme `--primary`.
  colors?: Record<number, string>;
};

const SORTS = ["az", "founded", "capacity"] as const;
type Sort = (typeof SORTS)[number];
// Translation-key per sort (label localized via the `teams` catalog, TASK-1603).
const SORT_LABEL_KEY: Record<Sort, string> = {
  az: "sortAz",
  founded: "sortFounded",
  capacity: "sortCapacity",
};

// Pure helper exported for unit tests. Case-insensitive substring match
// over `team.name` with leading/trailing whitespace trimmed.
export function filterTeams(teams: TeamDetail[], q: string): TeamDetail[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return teams;
  return teams.filter((entry) => entry.team.name.toLowerCase().includes(needle));
}

function nullLast(
  a: number | null,
  b: number | null,
  cmp: (x: number, y: number) => number,
): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return cmp(a, b);
}

// Pure sort exported for unit tests. A–Z by name; Founded oldest-first; Capacity
// biggest-first. Null founded/capacity sort to the end. Non-mutating + stable.
export function sortTeams(teams: TeamDetail[], sort: Sort): TeamDetail[] {
  const out = [...teams];
  if (sort === "founded") {
    out.sort((a, b) => nullLast(a.team.founded, b.team.founded, (x, y) => x - y));
  } else if (sort === "capacity") {
    out.sort((a, b) => nullLast(a.venue.capacity, b.venue.capacity, (x, y) => y - x));
  } else {
    out.sort((a, b) => a.team.name.localeCompare(b.team.name));
  }
  return out;
}

// Phase 15 redesign (TASK-1505) — the "polished crest grid". A search filter
// (shareable `?q=`) + an A–Z / Founded / Capacity sort (`?sort=`) + a live count,
// over a grid of refined club cards: a club-colour top accent, a large crest
// that lifts on hover, the name, and the founded year.
export function TeamFilter({ teams, season, colors = {} }: TeamFilterProps) {
  const t = useTranslations("teams");
  const locale = useLocale();
  const [q, setQ] = useQueryState("q", parseAsString.withDefault(""));
  const [sort, setSort] = useQueryState(
    "sort",
    parseAsStringLiteral(SORTS).withDefault("az").withOptions({ clearOnDefault: true }),
  );
  const visible = sortTeams(filterTeams(teams, q), sort);
  const trimmed = q.trim();

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value || null)}
          placeholder={t("filterPlaceholder", { season: formatSeasonLabel(season) })}
          aria-label={t("filterClubs")}
          className="sm:max-w-xs"
        />
        <div className="flex items-center gap-1.5" role="group" aria-label={t("sortClubs")}>
          <span className="text-muted-foreground me-1 text-xs font-medium">{t("sort")}</span>
          {SORTS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSort(s)}
              aria-pressed={sort === s}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                sort === s
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {t(SORT_LABEL_KEY[s])}
            </button>
          ))}
        </div>
      </div>

      <p className="text-muted-foreground text-sm" aria-live="polite">
        {trimmed
          ? t("showingCount", { shown: visible.length, total: teams.length })
          : t("clubCountHint", { total: teams.length })}
      </p>

      {visible.length === 0 ? (
        <EmptyState query={trimmed} onClear={() => setQ(null)} />
      ) : (
        <ul
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5"
          aria-label={t("clubCountAria", {
            count: visible.length,
            countFmt: localizeDigits(visible.length, locale),
          })}
        >
          {visible.map((entry, i) => (
            <TeamTile
              key={entry.team.id}
              entry={entry}
              season={season}
              color={colors[entry.team.id] ?? "var(--primary)"}
              revealIndex={i}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function TeamTile({
  entry,
  season,
  color,
  revealIndex,
}: {
  entry: TeamDetail;
  season: number;
  color: string;
  revealIndex: number;
}) {
  const t = useTranslations("teams");
  const locale = useLocale();
  const { team } = entry;
  return (
    <li {...revealProps(revealIndex)}>
      <Link
        href={withSeason(`/teams/${team.id}`, season)}
        aria-label={team.name}
        className="group block h-full rounded-xl focus-visible:outline-none"
      >
        <Card
          // TASK-1705 "Neon glow": the hover ring became a CLUB-COLOURED halo
          // (--ix-glow override); the lift + crest zoom (TASK-1505 identity)
          // stay. Keyboard focus keeps the explicit club-colour ring.
          style={
            {
              "--club": color,
              "--ix-glow": `color-mix(in srgb, ${color} 60%, transparent)`,
            } as CSSProperties
          }
          className="ix-glow relative flex h-full flex-col items-center gap-2 overflow-hidden p-4 motion-safe:hover:-translate-y-1 group-focus-visible:ring-2 group-focus-visible:ring-[color:var(--club)]"
        >
          {/* Club-colour top accent — the signature of the polished crest grid. */}
          <span
            aria-hidden
            className="absolute inset-x-0 top-0 h-1"
            style={{ backgroundColor: color }}
          />
          <Image
            src={team.logo}
            alt=""
            width={64}
            height={64}
            className="size-16 object-contain transition-transform duration-200 motion-safe:group-hover:scale-110"
            unoptimized
          />
          <p className="line-clamp-2 text-center text-sm leading-tight font-semibold">
            {team.name}
          </p>
          {team.founded !== null && (
            <p className="text-muted-foreground text-center text-xs">
              {/* Pre-localize the year to a string so /ar shows Eastern-Arabic
                  digits (a raw number arg formats Latin on bare `ar`). */}
              {t("established", { year: localizeDigits(team.founded, locale) })}
            </p>
          )}
        </Card>
      </Link>
    </li>
  );
}

function EmptyState({ query, onClear }: { query: string; onClear: () => void }) {
  const t = useTranslations("teams");
  return (
    <div
      role="status"
      className="border-border flex flex-col items-center gap-3 rounded-xl border border-dashed py-12 text-center"
    >
      <Search className="text-muted-foreground size-6" aria-hidden />
      <p className="text-sm">
        {t.rich("noClubsMatch", {
          query,
          q: (chunks) => <span className="text-foreground font-medium">“{chunks}”</span>,
        })}
      </p>
      <button
        type="button"
        onClick={onClear}
        className="text-primary text-sm font-medium hover:underline"
      >
        {t("clearFilter")}
      </button>
    </div>
  );
}
