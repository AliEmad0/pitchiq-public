"use client";

import { useLocale, useTranslations } from "next-intl";
import { Sparkles } from "lucide-react";
import { useState } from "react";

import { cn } from "@/utils/cn";
import { bidiIsolate, formatNumber, isRtl, localizeDigits } from "@/utils/format";
import { formatSeasonLabel } from "@/utils/season";

import type { TriviaFact, TriviaSource, TriviaValues } from "../types";

/**
 * Locale-format a fact's ICU values for the Arabic message (Arabic trivia).
 * Numbers become Eastern-Arabic; a `season` value renders as the full season
 * label; other numbers ≥ 1000 (attendances) group with a baseline comma; entity
 * names (strings) pass through in source form. English never calls this (it
 * renders the rule's `text`), so only the RTL path needs it.
 */
function localizeFactValues(
  values: TriviaValues | undefined,
  locale: string,
): Record<string, string> | undefined {
  if (!values) return undefined;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(values)) {
    if (typeof v !== "number") {
      out[k] = v;
    } else if (k === "season") {
      out[k] = formatSeasonLabel(v, locale);
    } else {
      out[k] = Math.abs(v) >= 1000 ? formatNumber(v, locale) : localizeDigits(v, locale);
    }
  }
  return out;
}

// Source-kind → message key in the `trivia` namespace (resolved at render).
const KIND_LABEL_KEY: Record<TriviaSource["kind"], string> = {
  standings: "kindStandings",
  leaderboard: "kindLeaderboards",
  fixtures: "kindFixtures",
  players: "kindPlayerStats",
  events: "kindMatchData",
};

/** "2024-25 standings" / "2015–2024 standings" — short, human provenance. */
function provenance(
  sources: TriviaSource[],
  kindLabel: (k: string) => string,
  locale: string,
): string {
  if (sources.length === 0) return "";
  // The `events` source kind (TASK-M26) is cross-season — it carries no
  // season — so drop undefined seasons and fall back to the kind alone.
  const seasons = [...new Set(sources.map((s) => s.season))]
    .filter((s): s is number => typeof s === "number")
    .sort((a, b) => a - b);
  const kinds = [...new Set(sources.map((s) => kindLabel(KIND_LABEL_KEY[s.kind])))];
  if (seasons.length === 0) return kinds.join(", ");
  // Bidi-isolate the season label/range so it can't visually flip in RTL — the
  // range is isolated as one unit (TASK-1605).
  const seasonPart =
    seasons.length === 1
      ? formatSeasonLabel(seasons[0], locale)
      : bidiIsolate(`${seasons[0]}–${seasons[seasons.length - 1]}`, locale);
  return `${seasonPart} ${kinds.join(", ")}`;
}

export type TriviaCardProps = {
  facts: TriviaFact[];
  /** Heading shown above the fact. */
  title?: string;
  className?: string;
  /**
   * "soft" (default) = subtle tinted card, used on team/player pages.
   * "solid" = filled with the brand color (`--primary`, which is era-aware:
   * claret in retro, teal in golden, magenta in modern) — used on the
   * redesigned dashboard so "Did you know?" reads as a bold accent block.
   */
  tone?: "soft" | "solid";
};

/**
 * Surfaces one provable `TriviaFact` at a time with a "Surprise me!" reshuffle
 * (round-robin through the page's facts). Props-driven — the page computes the
 * facts server-side and passes them down (TASK-1103), so they render in the
 * initial HTML. Each new fact re-mounts (keyed by `fact.id`) which re-triggers
 * the CSS `trivia-slide-up` keyframe; `prefers-reduced-motion` disables it.
 * Hides itself when there are no facts (the engine should always find some).
 */
export function TriviaCard({ facts, title, className, tone = "soft" }: TriviaCardProps) {
  const t = useTranslations("trivia");
  const locale = useLocale();
  const heading = title ?? t("heading");
  const [index, setIndex] = useState(0);
  if (facts.length === 0) return null;
  const fact = facts[index % facts.length];
  const solid = tone === "solid";
  // Localized fact on RTL when the rule carries a message key; English (and any
  // not-yet-localized rule) falls back to the source-form `text`.
  const factText =
    isRtl(locale) && fact.key ? t(fact.key, localizeFactValues(fact.values, locale)) : fact.text;

  return (
    <section
      aria-label={heading}
      className={cn(
        "rounded-lg border p-4 sm:p-5",
        solid
          ? "border-transparent bg-primary text-primary-foreground shadow-sm"
          : "border-primary/40 bg-primary/5",
        className,
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2
          className={cn(
            "flex items-center gap-1.5 text-sm font-semibold tracking-wide uppercase",
            solid ? "text-primary-foreground" : "text-primary",
          )}
        >
          <Sparkles className="size-4" aria-hidden />
          {heading}
        </h2>
        {facts.length > 1 && (
          <button
            type="button"
            onClick={() => setIndex((i) => (i + 1) % facts.length)}
            className={cn(
              "cursor-pointer text-xs font-medium transition-colors",
              solid
                ? "text-primary-foreground/80 hover:text-primary-foreground"
                : "text-muted-foreground hover:text-primary",
            )}
          >
            {t("surpriseMe")}
          </button>
        )}
      </div>
      <p
        key={fact.id}
        className={cn(
          "trivia-fact text-base leading-snug",
          solid ? "text-primary-foreground" : "text-foreground",
        )}
      >
        {factText}
      </p>
      {fact.sources.length > 0 && (
        <p
          className={cn(
            "mt-2 text-xs",
            solid ? "text-primary-foreground/75" : "text-muted-foreground",
          )}
        >
          {t("source", { provenance: provenance(fact.sources, t, locale) })}
        </p>
      )}
    </section>
  );
}
