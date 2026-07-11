import { useLocale, useTranslations } from "next-intl";

import { COMPARISON_METRICS } from "@/features/players/comparison-metrics";
import type { ComparisonMetrics } from "@/types/api";
import { localizeDigits } from "@/utils/format";
import { revealProps } from "@/utils/reveal";

// Season-stats grid for `/players/[id]` (TASK-610): one card per
// `ComparisonMetrics` field, label + value, em-dash on null.
//
// Reuses `COMPARISON_METRICS` (label + formatter + display order) from the
// compare page so a metric reads identically on both surfaces. Intentionally
// NOT built on `<StatRow>` — that primitive is a two-sided head-to-head bar
// (a vs b); a single player has no opponent, and a 50/50 bar with "—" on one
// side would be misleading. A flat value grid is the spec's "just the value".
export function PlayerSeasonStats({ metrics }: { metrics: ComparisonMetrics }) {
  const t = useTranslations("players");
  const locale = useLocale();
  // The per-metric labels come from the shared `metrics` glossary namespace
  // (TASK-1603 Compare batch) — same keys the /compare StatRows use, so a metric
  // reads identically on both surfaces.
  const tm = useTranslations("metrics");
  return (
    <section aria-label={t("seasonStatistics")} className="space-y-3" {...revealProps()}>
      <h2 className="text-xl font-semibold tracking-tight">{t("seasonStatistics")}</h2>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {COMPARISON_METRICS.map(({ key, labelKey, format }, i) => {
          const value = metrics[key];
          const fmt = format ?? ((n: number) => String(n));
          // TASK-M39: on the Appearances card, append the substitute-appearance
          // count — "35 (2)" — when we have it (modern seasons, PL API). A
          // starter with 0 sub apps has no value and shows plain appearances.
          const sub = key === "appearances" ? metrics.subAppearances : null;
          return (
            <div key={key} className="bg-card rounded-md border px-4 py-3" {...revealProps(i)}>
              <dt className="text-muted-foreground text-xs tracking-wide uppercase">
                {key === "appearances" && sub != null ? tm("appearancesSub") : tm(labelKey)}
              </dt>
              <dd className="mt-1 text-2xl font-bold tabular-nums">
                {value === null ? "—" : localizeDigits(fmt(value), locale)}
                {sub != null && (
                  <span className="text-muted-foreground ms-1 text-base font-medium">
                    ({localizeDigits(sub, locale)})
                  </span>
                )}
              </dd>
            </div>
          );
        })}
        {/* TASK-M20: expected goals + assists, shown only for the seasons whose
            source carries them (FBref 2017-24, FPL 2025-26 — null otherwise). */}
        {metrics.xg != null && <XgCard label={tm("xg")} value={metrics.xg} locale={locale} />}
        {metrics.xa != null && <XgCard label={tm("xa")} value={metrics.xa} locale={locale} />}
      </dl>
    </section>
  );
}

function XgCard({ label, value, locale }: { label: string; value: number; locale: string }) {
  return (
    <div className="bg-card rounded-md border px-4 py-3">
      <dt className="text-muted-foreground text-xs tracking-wide uppercase">{label}</dt>
      <dd className="mt-1 text-2xl font-bold tabular-nums">
        {localizeDigits(value.toFixed(1), locale)}
      </dd>
    </div>
  );
}
