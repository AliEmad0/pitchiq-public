"use client";

import { type CSSProperties, useId, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { populatedCategories, type StatDef } from "@/features/players/stat-categories";
import type { ComparisonMetrics } from "@/types/api";
import { localizeDigits } from "@/utils/format";
import { revealProps } from "@/utils/reveal";

// Season-stats view for `/players/[id]` (TASK-M65): the flat 14-card grid became
// a Category Accordion — ten collapsible sections (Playing time, Shooting, …,
// Goals against) covering all 66 SDP stats via `metrics.extended`. Only
// categories with data render, and within each only the populated fields, so a
// modern core-only season collapses to a few sections and a 2003-16 season fills
// all ten. Multi-open: opening a section never closes the others.
//
// Motion (owner picks): rows stagger in on reveal (`revealProps`), the open
// section's dot pulses + its header colour-washes once, the chevron rotates, and
// the panel height-slides (grid-rows 0fr→1fr). All degrade under reduced motion.

function formatValue(value: number, fmt: StatDef["fmt"], locale: string): string {
  if (fmt === "pct") return localizeDigits(`${value.toFixed(1)}%`, locale);
  if (fmt === "dec") return localizeDigits(value.toFixed(1), locale);
  return localizeDigits(String(value), locale);
}

export function PlayerSeasonStats({ metrics }: { metrics: ComparisonMetrics }) {
  const t = useTranslations("players");
  const tm = useTranslations("metrics");
  const locale = useLocale();
  const baseId = useId();

  const categories = populatedCategories(metrics);
  // Default the first populated category open so the section is never empty;
  // everything else starts collapsed and the reader opens what they want.
  const [open, setOpen] = useState<Set<string>>(() =>
    categories.length ? new Set([categories[0].category.key]) : new Set(),
  );

  const toggle = (key: string) =>
    setOpen((prev) => {
      const next = new Set(prev); // multi-open: only flip THIS section
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  if (!categories.length) return null;

  return (
    <section aria-label={t("seasonStatistics")} className="space-y-3">
      <h2 className="text-xl font-semibold tracking-tight" {...revealProps()}>
        {t("seasonStatistics")}
      </h2>
      <div className="flex flex-col gap-2">
        {categories.map(({ category, stats }, i) => {
          const isOpen = open.has(category.key);
          const panelId = `${baseId}-${category.key}`;
          return (
            <section
              key={category.key}
              data-open={isOpen}
              data-reveal=""
              style={
                { ...revealProps(i + 1).style, "--cat-accent": category.accent } as CSSProperties
              }
              className="bg-card overflow-hidden rounded-lg border"
            >
              <h3>
                <button
                  type="button"
                  onClick={() => toggle(category.key)}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  className={`statacc-wash ${isOpen ? "statacc-wash--open" : ""} focus-visible:ring-ring flex w-full items-center gap-3 px-4 py-3 text-start focus-visible:ring-2 focus-visible:outline-none`}
                >
                  <span
                    aria-hidden
                    className={`size-2.5 shrink-0 rounded-[3px] ${isOpen ? "statacc-dot--open" : ""}`}
                    style={{ background: "var(--cat-accent)" }}
                  />
                  <span className="flex-1 text-sm font-semibold tracking-wide uppercase">
                    {tm(category.titleKey)}
                  </span>
                  <span className="text-muted-foreground font-mono text-xs tabular-nums">
                    {localizeDigits(String(stats.length), locale)}
                  </span>
                  <svg
                    aria-hidden
                    viewBox="0 0 16 16"
                    className={`size-4 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                    style={{ transitionTimingFunction: "var(--ease-pop)" }}
                  >
                    <path
                      d="M4 6l4 4 4-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </h3>
              <div
                id={panelId}
                role="region"
                aria-label={tm(category.titleKey)}
                className={`grid transition-[grid-template-rows] duration-300 ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
                style={{ transitionTimingFunction: "var(--ease-out-soft)" }}
              >
                <div className="overflow-hidden">
                  <dl className="grid grid-cols-2 gap-2 px-4 pb-4 sm:grid-cols-3 lg:grid-cols-4">
                    {stats.map(({ def, value }) => {
                      // Appearances card folds in the substitute-appearance count
                      // (TASK-M39): "35 (2)" with an "Appearances (Sub)" label.
                      const sub =
                        def.key === "appearances" ? (metrics.subAppearances ?? null) : null;
                      return (
                        <div key={def.key} className="bg-background/40 rounded-md border px-3 py-2">
                          <dt className="text-muted-foreground text-xs tracking-wide uppercase">
                            {def.key === "appearances" && sub != null
                              ? tm("appearancesSub")
                              : tm(def.labelKey)}
                          </dt>
                          <dd className="mt-0.5 text-xl font-bold tabular-nums">
                            {formatValue(value, def.fmt, locale)}
                            {sub != null && (
                              <span className="text-muted-foreground ms-1 text-sm font-medium">
                                ({localizeDigits(sub, locale)})
                              </span>
                            )}
                          </dd>
                        </div>
                      );
                    })}
                  </dl>
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
}
