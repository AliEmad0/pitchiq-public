import { afterEach, describe, expect, it } from "vitest";
import { cleanup, screen } from "@testing-library/react";

import { COMPARISON_METRICS } from "@/features/players/comparison-metrics";
import { PlayerSeasonStats } from "@/features/players/components/PlayerSeasonStats";
import type { ComparisonMetrics } from "@/types/api";

import { renderWithIntl } from "./_helpers/intl";

function metrics(overrides: Partial<ComparisonMetrics> = {}): ComparisonMetrics {
  return {
    appearances: null,
    goals: null,
    assists: null,
    passAccuracy: null,
    keyPasses: null,
    tackles: null,
    interceptions: null,
    duelsWon: null,
    dribblesCompleted: null,
    shotsOnTarget: null,
    yellowCards: null,
    redCards: null,
    ...overrides,
  };
}

afterEach(cleanup);

describe("PlayerSeasonStats", () => {
  it("renders a card for all 12 ComparisonMetrics", () => {
    renderWithIntl(<PlayerSeasonStats metrics={metrics()} />);
    for (const { label } of COMPARISON_METRICS) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(COMPARISON_METRICS).toHaveLength(12);
  });

  it("formats values (percentage suffix on pass accuracy) and em-dashes nulls", () => {
    renderWithIntl(
      <PlayerSeasonStats metrics={metrics({ goals: 29, passAccuracy: 78.4, assists: null })} />,
    );
    expect(screen.getByText("29")).toBeInTheDocument();
    expect(screen.getByText("78.4%")).toBeInTheDocument();
    // assists (and the other untouched metrics) render an em-dash.
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  // TASK-M39 — substitute-appearance breakdown on the Appearances card.
  it("shows '(n)' + an 'Appearances (Sub)' label when subAppearances is present", () => {
    renderWithIntl(<PlayerSeasonStats metrics={metrics({ appearances: 35, subAppearances: 2 })} />);
    expect(screen.getByText("Appearances (Sub)")).toBeInTheDocument();
    expect(screen.getByText("(2)")).toBeInTheDocument();
    expect(screen.queryByText("Appearances")).not.toBeInTheDocument();
  });

  it("keeps the plain 'Appearances' label with no parens when sub data is absent", () => {
    renderWithIntl(<PlayerSeasonStats metrics={metrics({ appearances: 35 })} />);
    expect(screen.getByText("Appearances")).toBeInTheDocument();
    expect(screen.queryByText(/^\(\d+\)$/)).not.toBeInTheDocument();
  });

  // TASK-M20 — xG/xA cards, shown only for seasons whose source carries them.
  it("shows xG + xA cards (1dp) when present", () => {
    renderWithIntl(<PlayerSeasonStats metrics={metrics({ xg: 20.2, xa: 9.43 })} />);
    expect(screen.getByText("Expected goals (xG)")).toBeInTheDocument();
    expect(screen.getByText("20.2")).toBeInTheDocument();
    expect(screen.getByText("Expected assists (xA)")).toBeInTheDocument();
    expect(screen.getByText("9.4")).toBeInTheDocument(); // 9.43 → 1dp
  });

  it("omits the xG/xA cards when absent (pre-2017 eras)", () => {
    renderWithIntl(<PlayerSeasonStats metrics={metrics()} />);
    expect(screen.queryByText("Expected goals (xG)")).not.toBeInTheDocument();
    expect(screen.queryByText("Expected assists (xA)")).not.toBeInTheDocument();
  });
});
