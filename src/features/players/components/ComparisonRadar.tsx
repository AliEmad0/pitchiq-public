"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";

import type { MetricMaxes } from "@/features/players/metric-maxes.api";
import { normalizeForRadar, RADAR_AXES } from "@/features/players/normalize-for-radar";
import type { ComparisonMetrics } from "@/types/api";
import { cn } from "@/utils/cn";

// Message keys (in the `metrics` namespace) for the radar axis labels. Kept
// short enough to fit at chart corners without overlap on mobile widths —
// "Pass %" rather than "Pass accuracy", "Dribbles" rather than "Dribbles
// completed". The keys match `RADAR_AXES` exactly so a typo fails TypeScript.
const AXIS_LABEL_KEYS: Record<(typeof RADAR_AXES)[number], string> = {
  goals: "axisGoals",
  assists: "axisAssists",
  passAccuracy: "axisPassPct",
  tackles: "axisTackles",
  dribblesCompleted: "axisDribbles",
  shotsOnTarget: "axisShotsOnTarget",
};

// Slot A / B series colours come from the --chart-1 / --chart-2 CSS tokens
// (TASK-908). recharts paints to SVG via inline attributes — not `style` — so
// `var(--chart-1)` wouldn't resolve as an attribute value; we read the computed
// token at runtime instead. SSR + the happy-dom test env fall back to the prior
// hex literals (parity). TASK-909 swaps the token values for the PL palette.
const CHART_FALLBACK = { a: "#3b82f6", b: "#f97316" } as const;

export type ComparisonRadarProps = {
  aMetrics: ComparisonMetrics;
  bMetrics: ComparisonMetrics;
  aName: string;
  bName: string;
  maxes: MetricMaxes;
  className?: string;
};

// Six-axis radar overlaying the two players' normalised performance on
// goals / assists / pass accuracy / tackles / dribbles / shots on
// target. Normalisation is delegated to TASK-410's `normalizeForRadar`
// — this component is a thin recharts wrapper that owns presentation
// only (axis labels, colours, responsive sizing, accessibility).
//
// Disciplinary cards (yellow / red) are intentionally absent from the
// chart: giving "yellow cards" an axis would imply more = better at
// one corner, which the eye reads incorrectly on a radar. Those metrics
// live in the `<StatRow>` stack instead, where the divergent-bar
// rendering makes the "lower is better" reading obvious.
export function ComparisonRadar({
  aMetrics,
  bMetrics,
  aName,
  bName,
  maxes,
  className,
}: ComparisonRadarProps) {
  const t = useTranslations("metrics");
  const [colors, setColors] = useState<{ a: string; b: string }>(CHART_FALLBACK);
  useEffect(() => {
    const root = getComputedStyle(document.documentElement);
    const a = root.getPropertyValue("--chart-1").trim();
    const b = root.getPropertyValue("--chart-2").trim();
    if (a && b) setColors({ a, b });
  }, []);

  const aNorm = normalizeForRadar(aMetrics, maxes);
  const bNorm = normalizeForRadar(bMetrics, maxes);

  // Recharts wants a flat array of `{ axis, a, b }` rows — one per axis.
  // Stable `a` / `b` data keys keep the prop wiring independent of the
  // (possibly-duplicate) player names; legend names are set explicitly
  // via the `name` prop on each `<Radar>`.
  const data = RADAR_AXES.map((axis) => ({
    axis: t(AXIS_LABEL_KEYS[axis]),
    a: aNorm[axis],
    b: bNorm[axis],
  }));

  return (
    <div
      role="img"
      aria-label={t("radarAria", { a: aName, b: bName })}
      className={cn("w-full", className)}
    >
      {/* The chart gets its own fixed height. The legend is rendered as HTML
          BELOW it (TASK-1513) rather than recharts' in-chart `<Legend>`, which
          overlapped the polygon on long season/career labels. */}
      <div className="h-64 w-full sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius="72%">
            <PolarGrid />
            <PolarAngleAxis dataKey="axis" tick={{ fontSize: 12 }} />
            {/* Hide the numeric radius ticks — we don't want users
                reading raw normalised values; the polygon shapes carry
                the comparison. Domain pinned to [0, 1] so legitimate
                page-2 outliers (clamped to 1 by normalizeForRadar) still
                touch the outer ring. */}
            <PolarRadiusAxis domain={[0, 1]} tick={false} axisLine={false} />
            <Radar name={aName} dataKey="a" stroke={colors.a} fill={colors.a} fillOpacity={0.3} />
            <Radar name={bName} dataKey="b" stroke={colors.b} fill={colors.b} fillOpacity={0.3} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <ul className="text-muted-foreground mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-xs">
        <li className="flex items-center gap-1.5">
          <span
            className="size-2.5 shrink-0 rounded-sm"
            style={{ backgroundColor: colors.a }}
            aria-hidden
          />
          <span>{aName}</span>
        </li>
        <li className="flex items-center gap-1.5">
          <span
            className="size-2.5 shrink-0 rounded-sm"
            style={{ backgroundColor: colors.b }}
            aria-hidden
          />
          <span>{bName}</span>
        </li>
      </ul>
    </div>
  );
}
