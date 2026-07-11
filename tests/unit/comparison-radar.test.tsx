import { cleanup, screen } from "@testing-library/react";
import { renderWithIntl } from "./_helpers/intl";
import { cloneElement, isValidElement, type ReactElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

// Mock recharts' `ResponsiveContainer` to inject a fixed `width` /
// `height` onto its single child. happy-dom doesn't compute parent
// layout, so without this the inner `<RadarChart>` measures 0×0 and
// paints no SVG content — every `getByText` for axis labels / legend
// would 404 even on a correct implementation. The real
// `ResponsiveContainer` does exactly this `cloneElement` pattern under
// the hood, so the mock is faithful to production behaviour; it just
// pins the dimensions instead of measuring them.
vi.mock("recharts", async () => {
  const actual = await vi.importActual<typeof import("recharts")>("recharts");
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: ReactElement }) => {
      if (!isValidElement(children)) return children;
      return cloneElement(children as ReactElement<{ width?: number; height?: number }>, {
        width: 600,
        height: 400,
      });
    },
  };
});

import { ComparisonRadar } from "@/features/players/components/ComparisonRadar";
import type { MetricMaxes } from "@/features/players/metric-maxes.api";
import type { ComparisonMetrics } from "@/types/api";

function metrics(overrides: Partial<ComparisonMetrics> = {}): ComparisonMetrics {
  return {
    appearances: 30,
    goals: 18,
    assists: 11,
    passAccuracy: 84,
    keyPasses: 62,
    tackles: 28,
    interceptions: 14,
    duelsWon: 118,
    dribblesCompleted: 51,
    shotsOnTarget: 47,
    yellowCards: 6,
    redCards: 2,
    ...overrides,
  };
}

const MAXES: MetricMaxes = {
  goals: 30,
  assists: 20,
  passAccuracy: 95,
  tackles: 100,
  dribblesCompleted: 120,
  shotsOnTarget: 80,
};

afterEach(() => {
  cleanup();
});

describe("ComparisonRadar", () => {
  it("renders all six axis labels", () => {
    renderWithIntl(
      <ComparisonRadar
        aMetrics={metrics()}
        bMetrics={metrics()}
        aName="Player A"
        bName="Player B"
        maxes={MAXES}
      />,
    );

    // Each axis name is rendered by recharts as an SVG <text> node.
    // Labels are the human-readable display names — short enough to fit
    // at chart corners (e.g. "Pass %" not "Pass accuracy").
    expect(screen.getByText("Goals")).toBeInTheDocument();
    expect(screen.getByText("Assists")).toBeInTheDocument();
    expect(screen.getByText("Pass %")).toBeInTheDocument();
    expect(screen.getByText("Tackles")).toBeInTheDocument();
    expect(screen.getByText("Dribbles")).toBeInTheDocument();
    expect(screen.getByText("Shots on target")).toBeInTheDocument();
  });

  it("renders both player names in the legend", () => {
    renderWithIntl(
      <ComparisonRadar
        aMetrics={metrics()}
        bMetrics={metrics()}
        aName="Bruno Fernandes"
        bName="Bukayo Saka"
        maxes={MAXES}
      />,
    );

    expect(screen.getByText("Bruno Fernandes")).toBeInTheDocument();
    expect(screen.getByText("Bukayo Saka")).toBeInTheDocument();
  });

  it("has an aria-label that names both players for screen readers", () => {
    // The chart itself is rendered as SVG with text labels. A wrapper
    // aria-label gives assistive tech a single coherent description for
    // the whole figure ("Radar comparison of A vs B").
    renderWithIntl(
      <ComparisonRadar
        aMetrics={metrics()}
        bMetrics={metrics()}
        aName="Bruno Fernandes"
        bName="Bukayo Saka"
        maxes={MAXES}
      />,
    );

    const wrapper = screen.getByRole("img", {
      name: /bruno fernandes/i,
    });
    expect(wrapper).toBeInTheDocument();
    expect(wrapper).toHaveAccessibleName(
      /bruno fernandes.*bukayo saka|bukayo saka.*bruno fernandes/i,
    );
  });

  it("normalises values through `normalizeForRadar` — a player at the league max occupies the outer ring on that axis", () => {
    // Sanity check that the radar consumes the same normalisation
    // contract as TASK-410. With `goals: 30` and `maxes.goals: 30`, the
    // normalised value is 1.0 — the radar SHOULD render that vertex on
    // the outer ring (radius=1). We can't measure pixel positions in
    // happy-dom, but we can assert that the chart rendered cleanly
    // without crashing on the normalisation edge case.
    renderWithIntl(
      <ComparisonRadar
        aMetrics={metrics({ goals: 30 })}
        bMetrics={metrics({ goals: 0 })}
        aName="Top scorer"
        bName="No goals"
        maxes={MAXES}
      />,
    );

    expect(screen.getByText("Top scorer")).toBeInTheDocument();
    expect(screen.getByText("No goals")).toBeInTheDocument();
    expect(screen.getByText("Goals")).toBeInTheDocument();
  });

  it("does not crash when a player's value is null on an axis", () => {
    // TASK-410's contract: null → 0 on that axis. The chart should
    // render the player's polygon clamped at the centre on the null
    // axis, with no NaN-fallthrough or crash. We can't observe the
    // polygon path in happy-dom but we can confirm the chart mounted.
    renderWithIntl(
      <ComparisonRadar
        aMetrics={metrics({ passAccuracy: null })}
        bMetrics={metrics()}
        aName="Sparse"
        bName="Complete"
        maxes={MAXES}
      />,
    );

    expect(screen.getByText("Pass %")).toBeInTheDocument();
    expect(screen.getByText("Sparse")).toBeInTheDocument();
  });
});
