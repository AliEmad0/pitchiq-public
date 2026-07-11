import { useLocale } from "next-intl";

import { cn } from "@/utils/cn";
import { localizeDigits } from "@/utils/format";

export type StatRowProps = {
  // Metric name shown below the bar (e.g. "Goals", "Pass accuracy").
  label: string;
  // Left side's value. `null` for "not measured" — the the wire wire
  // convention `ComparisonMetrics` preserves; renders as "—".
  a: number | null;
  // Right side's value. Same semantics as `a`.
  b: number | null;
  // Optional formatter for the values (e.g. percentages). The same
  // formatter is applied to the +X delta chip so "+3.7%" reads correctly
  // alongside "78.4%" / "82.1%".
  format?: (n: number) => string;
  className?: string;
};

// Single-row head-to-head bar for `/compare` (TASK-406). Reused by the
// dashboard's match-detail page in a future cleanup (TASK-213 currently
// inlines a similar local primitive — the comment on
// `src/features/leagues/components/StatComparison.tsx` flags this
// component as the planned replacement). Intentionally kept generic over
// numeric values so it can render PL `ComparisonMetrics` and per-match
// `FixtureStatBlock` rows with the same primitive.
//
// Splits a single bar by `a / (a + b)` when both values are non-null and
// the sum is positive; falls back to a flat 50/50 neutral bar otherwise.
// The 50/50 fallback handles three cases: equal values, both-zero (no
// division-by-zero), and either-null (one side not measured — we can't
// honestly show a ratio).
export function StatRow({ label, a, b, format, className }: StatRowProps) {
  const locale = useLocale();
  const fmt = (n: number) => localizeDigits((format ?? ((x: number) => String(x)))(n), locale);
  const aDisplay = a === null ? "—" : fmt(a);
  const bDisplay = b === null ? "—" : fmt(b);

  // Bar split: both must be measured AND sum to a positive number.
  // Otherwise render a flat neutral 50/50 — see comment above.
  const haveBoth = a !== null && b !== null;
  const total = haveBoth ? a + b : 0;
  const aFrac = haveBoth && total > 0 ? a / total : 0.5;
  const bFrac = 1 - aFrac;

  // Winner highlight only fires when both values are known and unequal.
  const aWins = haveBoth && a > b;
  const bWins = haveBoth && b > a;
  const delta = haveBoth ? Math.abs(a - b) : null;

  return (
    <li className={cn("bg-card rounded-md border px-4 py-3", className)}>
      <div className="grid grid-cols-[1fr_8rem_1fr] items-center gap-3">
        {/* Slot A — right-aligned: number on the inside, +X chip on the outside */}
        <div className="flex items-center justify-end gap-2">
          {aWins && delta !== null && (
            <span className="bg-primary/10 text-primary rounded-full px-1.5 py-0.5 text-xs font-medium tabular-nums">
              +{fmt(delta)}
            </span>
          )}
          <span className={cn("text-end font-mono text-sm tabular-nums", aWins && "font-bold")}>
            {aDisplay}
          </span>
        </div>

        {/* The bar itself — two halves, sized inline via percent widths */}
        <div className="bg-muted flex h-2 w-full overflow-hidden rounded-full" aria-hidden>
          <div
            data-testid="stat-row-bar-a"
            className="bg-primary h-full"
            style={{ width: `${aFrac * 100}%` }}
          />
          <div
            data-testid="stat-row-bar-b"
            className="bg-secondary h-full"
            style={{ width: `${bFrac * 100}%` }}
          />
        </div>

        {/* Slot B — left-aligned: number on the inside, +X chip on the outside */}
        <div className="flex items-center gap-2">
          <span className={cn("text-start font-mono text-sm tabular-nums", bWins && "font-bold")}>
            {bDisplay}
          </span>
          {bWins && delta !== null && (
            <span className="bg-secondary/10 text-secondary-foreground rounded-full px-1.5 py-0.5 text-xs font-medium tabular-nums">
              +{fmt(delta)}
            </span>
          )}
        </div>
      </div>

      <p className="text-muted-foreground mt-1 text-center text-xs tracking-wide uppercase">
        {label}
      </p>
    </li>
  );
}
