import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/navigation";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { StandingsRow } from "@/types/api";
import { cn } from "@/utils/cn";
import { localizeDigits } from "@/utils/format";
import { withSeason } from "@/utils/season";

// Qualification colors come from api-football's own `description` text
// (synthesized from `descriptionForTeam(teamId, season)` in the data
// adapter — see src/features/leagues/api.ts). The per-season qualification
// map handles edge cases that simple rank ranges can't (5th CL spot via
// UEFA coefficient, FA Cup winner displacement, EFL Cup cascade, etc.).
//
// Each tier ships a matched (border, rowTint) pair so the left-border
// accent and the row tint stay visually coherent. Palette matches the
// official PL broadcast graphic: CL = blue, UEL = orange, UECL = green,
// Relegation = red. The full-row TINT is DARK-MODE ONLY (`-950/40`) — in light
// mode only the coloured left border marks a qualification row (the row tint
// was visually heavy on the light theme). Mid-table rows (no `description`)
// keep the existing zebra stripe.
// Patterns match the era-accurate `description` strings from
// `descriptionForTeam` — the europa bucket is "UEFA Cup" pre-2009, the
// conference bucket is "Cup Winners' Cup" pre-1999 (TASK-M04), so each pattern
// matches BOTH era names for its color. `fallbackLabel` is used only if a season
// somehow has no row text to derive a label from.
// `dot` is the legend swatch colour. It MUST be a full, static class string —
// the legend used to derive it at runtime (`border.replace("border-s-","bg-")`),
// but Tailwind v4 only emits CSS for classes it finds statically in source, so
// those runtime-built `bg-blue-500` etc. classes were never generated and the
// swatches rendered invisible (TASK-1504 bugfix).
const QUALIFICATION_STYLES = [
  {
    pattern: /Champions League/i,
    fallbackLabel: "Champions League",
    border: "border-s-blue-500",
    rowTint: "dark:bg-blue-950/40",
    dot: "bg-blue-500",
  },
  {
    pattern: /Europa League|UEFA Cup/i,
    fallbackLabel: "Europa League",
    border: "border-s-orange-500",
    rowTint: "dark:bg-orange-950/40",
    dot: "bg-orange-500",
  },
  {
    pattern: /Conference League|Cup Winners/i,
    fallbackLabel: "Conference League",
    border: "border-s-green-500",
    rowTint: "dark:bg-green-950/40",
    dot: "bg-green-500",
  },
  {
    pattern: /Relegation/i,
    fallbackLabel: "Relegation",
    border: "border-s-red-500",
    rowTint: "dark:bg-red-950/40",
    dot: "bg-red-500",
  },
] as const;

type QualStyle = { border: string; rowTint: string };

function getQualificationStyle(description: string | null): QualStyle | null {
  if (!description) return null;
  for (const style of QUALIFICATION_STYLES) {
    if (style.pattern.test(description)) {
      return { border: `border-s-4 ${style.border}`, rowTint: style.rowTint };
    }
  }
  return null;
}

const FORM_STYLE: Record<string, { className: string }> = {
  W: { className: "bg-success text-success-foreground" },
  D: { className: "bg-muted-foreground text-background" },
  L: { className: "bg-destructive text-destructive-foreground" },
};

// Screen-reader label key per result (className stays in FORM_STYLE). Localized
// via the `standings` catalog (TASK-1603).
const FORM_LABEL_KEY: Record<string, string> = { W: "formWin", D: "formDraw", L: "formLoss" };

function FormChips({ form }: { form: string }) {
  const t = useTranslations("standings");
  if (!form) {
    return (
      <span className="text-muted-foreground" aria-label={t("noForm")}>
        —
      </span>
    );
  }
  // api-football appends new results to the right; take the last 5 so the
  // most recent match is the right-most chip.
  const last5 = form.slice(-5).split("");
  return (
    <div className="flex gap-1" role="list" aria-label={t("recentForm")}>
      {last5.map((result, i) => {
        const style = FORM_STYLE[result] ?? { className: "bg-muted-foreground text-background" };
        return (
          <span
            key={i}
            role="listitem"
            aria-label={t(FORM_LABEL_KEY[result] ?? "formUnknown")}
            className={cn(
              "inline-flex size-5 items-center justify-center rounded text-[10px] font-bold",
              style.className,
            )}
          >
            {result}
          </span>
        );
      })}
    </div>
  );
}

function formatGoalDiff(gd: number): string {
  if (gd > 0) return `+${gd}`;
  return String(gd);
}

type Props = {
  rows: readonly StandingsRow[];
  // The viewing season — preserved on the team links so a historical standings
  // row navigates to that season's team page, not the current default (TASK-M09).
  season: number;
};

// Server Component. Renders the 20-row Premier League standings with form
// column, qualification colors driven by api-football's `description` field,
// and sticky #/Club columns on mobile.
//
// Loading state lives at the route boundary — wrap in <Suspense> with
// <TableRowSkeleton count={20} /> (TASK-107) as the fallback.
//
// The team-name cell links to `/teams/${id}`. That route may 404 until
// TASK-305 lands — the link is intentionally created here so navigation is
// wired the moment the team page exists.
export function StandingsTable({ rows, season }: Props) {
  const t = useTranslations("standings");
  const locale = useLocale();
  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            {/* The # column is pinned to an EXACT 44px (w/min-w/max-w all equal)
                so the Club sticky offset (start-11 = 44px) lands flush against it —
                otherwise the column auto-sizes narrower than the offset and the
                scrolled middle columns peek through the gap on mobile (TASK-1505
                bugfix). */}
            <TableHead className="sticky start-0 z-20 w-11 max-w-11 min-w-11 bg-card text-center">
              {t("rank")}
            </TableHead>
            <TableHead className="sticky start-11 z-20 min-w-[180px] border-e bg-card">
              {t("club")}
            </TableHead>
            <TableHead className="text-end">{t("mp")}</TableHead>
            <TableHead className="text-end">{t("w")}</TableHead>
            <TableHead className="text-end">{t("d")}</TableHead>
            <TableHead className="text-end">{t("l")}</TableHead>
            <TableHead className="text-end">{t("gf")}</TableHead>
            <TableHead className="text-end">{t("ga")}</TableHead>
            <TableHead className="text-end">{t("gd")}</TableHead>
            <TableHead className="min-w-[120px]">{t("form")}</TableHead>
            {/* Pts pinned to the right edge so it stays visible while the
                middle columns scroll on mobile (TASK-1504). */}
            <TableHead className="sticky end-0 z-20 border-s bg-card text-end font-bold">
              {t("pts")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const qual = getQualificationStyle(row.description);
            // The full-row tint is dark-only now (TASK-1504); in light mode a
            // qualification row carries only its coloured left border.
            const rowBg = qual ? qual.rowTint : "even:bg-muted/30";
            // The frozen columns (# / Club left, Pts right) MUST be FULLY OPAQUE
            // or the middle columns scroll through them and the text becomes an
            // unreadable overlap on mobile (TASK-1504 bugfix). `bg-card` (opaque,
            // matches the tile) in BOTH modes — note we deliberately do NOT add
            // the qualification tint here: the dark tint is `bg-…-950/40` (40%
            // alpha), which would override bg-card and make the frozen column
            // translucent again, re-introducing the bleed-through in dark mode.
            // The qualification signal still reads via the coloured left border
            // (always) + the middle-column tint (dark). The border-e/border-s
            // mark the frozen-column edges; the old `even:bg-muted/30` here was a
            // bug — `even:` matches the CELL's sibling index (the Club cell is the
            // 2nd child = always "even"), so it was permanently translucent.
            const stickyBg = "bg-card";
            return (
              // ix-row (TASK-1705): accent hover wash painted on the CELLS so
              // it covers the opaque sticky # / Club / Pts columns too.
              <TableRow key={row.team.id} className={cn("ix-row", rowBg)}>
                {/* The qualification colour border lives on the STICKY # cell (not
                    the row) so it stays frozen at the left edge during horizontal
                    scroll, exactly like the # / Club columns (TASK-1505). The
                    border is box-border, so it eats into the 44px width rather
                    than widening the column — the Club offset stays flush. */}
                <TableCell
                  className={cn(
                    "sticky start-0 z-10 w-11 max-w-11 min-w-11 text-center font-medium",
                    qual?.border,
                    stickyBg,
                  )}
                >
                  {localizeDigits(row.rank, locale)}
                </TableCell>
                <TableCell className={cn("sticky start-11 z-10 border-e", stickyBg)}>
                  <Link
                    href={withSeason(`/teams/${row.team.id}`, season)}
                    className="flex items-center gap-2 hover:underline"
                  >
                    <Image
                      src={row.team.logo}
                      alt=""
                      width={24}
                      height={24}
                      className="size-6 shrink-0 object-contain"
                      unoptimized
                    />
                    <span className="truncate">{row.team.name}</span>
                  </Link>
                </TableCell>
                <TableCell className="text-end tabular-nums">
                  {localizeDigits(row.all.played, locale)}
                </TableCell>
                <TableCell className="text-end tabular-nums">
                  {localizeDigits(row.all.win, locale)}
                </TableCell>
                <TableCell className="text-end tabular-nums">
                  {localizeDigits(row.all.draw, locale)}
                </TableCell>
                <TableCell className="text-end tabular-nums">
                  {localizeDigits(row.all.lose, locale)}
                </TableCell>
                <TableCell className="text-end tabular-nums">
                  {localizeDigits(row.all.goals.for, locale)}
                </TableCell>
                <TableCell className="text-end tabular-nums">
                  {localizeDigits(row.all.goals.against, locale)}
                </TableCell>
                <TableCell className="text-end tabular-nums">
                  {localizeDigits(formatGoalDiff(row.goalsDiff), locale)}
                </TableCell>
                <TableCell>
                  <FormChips form={row.form} />
                </TableCell>
                <TableCell
                  className={cn(
                    "sticky end-0 z-10 border-s text-end font-bold tabular-nums",
                    stickyBg,
                  )}
                >
                  {localizeDigits(row.points, locale)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {rows.length > 0 ? <StandingsLegend rows={rows} /> : null}
    </>
  );
}

// Strip the api-football-style prefix/suffix to get the bare competition name,
// e.g. "Promotion - UEFA Cup" → "UEFA Cup", "Relegation - Championship" →
// "Relegation", "Promotion - Champions League (Group Stage)" → "Champions League".
function cleanQualificationLabel(description: string): string {
  return description
    .replace(/^(Promotion|Relegation)\s*-\s*/i, "")
    .replace(/\s*\(Group Stage\)\s*$/i, "")
    .replace(/^Championship$/i, "Relegation")
    .trim();
}

// The bare competition name → its `standings` catalog key. The set is bounded
// and era-accurate (TASK-M04): the europa bucket derives to "UEFA Cup" (≤2008)
// or "Europa League" (≥2009), the conference bucket to "Cup Winners' Cup"
// (≤1998) or "Conference League" (≥2021) — so the six keys cover every possible
// derived label across all 34 seasons. English values are identical to these
// names, so the legend reads the same on `/en`; `/ar` gets the Arabic names.
const QUAL_LABEL_KEY: Record<string, string> = {
  "Champions League": "qualChampionsLeague",
  "Europa League": "qualEuropaLeague",
  "UEFA Cup": "qualUefaCup",
  "Conference League": "qualConferenceLeague",
  "Cup Winners' Cup": "qualCupWinnersCup",
  Relegation: "qualRelegation",
};

// Always-visible qualification color key (TASK-1504). The key is DERIVED from
// the rows actually present this season (TASK-M04), so it shows era-correct
// names (e.g. "UEFA Cup" / "Cup Winners' Cup" for the 90s) and only the
// competitions that exist for the season. `mt-auto` pins it to the bottom of the
// (flex-column) standings tile so the tile fills its height to match the right
// column — filling the space under the table instead of leaving a gap.
function StandingsLegend({ rows }: { rows: readonly StandingsRow[] }) {
  const t = useTranslations("standings");
  const descriptions = rows.map((r) => r.description).filter((d): d is string => Boolean(d));
  const items: Array<{ dot: string; label: string }> = [];
  for (const style of QUALIFICATION_STYLES) {
    const match = descriptions.find((d) => style.pattern.test(d));
    // The competition name is DATA-DERIVED from `row.description` (era-accurate:
    // "UEFA Cup" vs "Europa League" per TASK-M04) and is the same string the
    // colour regex matches on. Map it to a `standings` catalog key so the legend
    // reads Arabic on `/ar` (English values are identical, so `/en` is unchanged);
    // an unmapped name (shouldn't happen) falls back to the raw derived string.
    if (match) {
      const name = cleanQualificationLabel(match);
      const key = QUAL_LABEL_KEY[name];
      items.push({ dot: style.dot, label: key ? t(key) : name });
    }
  }

  if (items.length === 0) return null;

  return (
    <ul
      className="text-muted-foreground mt-auto flex flex-wrap gap-x-5 gap-y-2 border-t pt-3 text-xs"
      aria-label={t("qualLegend")}
    >
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-2">
          <span aria-hidden="true" className={cn("inline-block size-3 rounded-sm", item.dot)} />
          <span>{item.label}</span>
        </li>
      ))}
    </ul>
  );
}
