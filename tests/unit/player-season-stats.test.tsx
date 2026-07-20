import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, screen } from "@testing-library/react";

import { PlayerSeasonStats } from "@/features/players/components/PlayerSeasonStats";
import type { ComparisonMetrics, ExtendedMetrics } from "@/types/api";

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

describe("PlayerSeasonStats — Category Accordion (TASK-M65)", () => {
  it("renders nothing when no stat has a value", () => {
    const { container } = renderWithIntl(<PlayerSeasonStats metrics={metrics()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows a category header only for categories that have data", () => {
    renderWithIntl(<PlayerSeasonStats metrics={metrics({ goals: 12, tackles: 40 })} />);
    expect(screen.getByRole("button", { name: /Shooting/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Defending/i })).toBeInTheDocument();
    // Crossing & corners is extended-only; all null here → category omitted.
    expect(screen.queryByRole("button", { name: /Crossing/i })).not.toBeInTheDocument();
  });

  it("renders core + extended fields inside their categories", () => {
    const extended = { totalShots: 44, touches: 1270 } as ExtendedMetrics;
    renderWithIntl(
      <PlayerSeasonStats metrics={metrics({ goals: 4, shotsOnTarget: 8, extended })} />,
    );
    expect(screen.getByText("Goals")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("Total shots")).toBeInTheDocument(); // from metrics.extended
    expect(screen.getByText("44")).toBeInTheDocument();
    expect(screen.getByText("Touches")).toBeInTheDocument();
    expect(screen.getByText("1270")).toBeInTheDocument();
  });

  it("hides fields that are null (no em-dash filler)", () => {
    renderWithIntl(<PlayerSeasonStats metrics={metrics({ goals: 4 })} />);
    expect(screen.queryByText("—")).not.toBeInTheDocument();
    expect(screen.queryByText("Total shots")).not.toBeInTheDocument();
  });

  it("formats pass accuracy (%) and xG/xA (1dp)", () => {
    renderWithIntl(
      <PlayerSeasonStats metrics={metrics({ passAccuracy: 78.4, xg: 20.2, xa: 9.43 })} />,
    );
    expect(screen.getByText("78.4%")).toBeInTheDocument();
    expect(screen.getByText("Expected goals (xG)")).toBeInTheDocument();
    expect(screen.getByText("20.2")).toBeInTheDocument();
    expect(screen.getByText("9.4")).toBeInTheDocument(); // 9.43 → 1dp
  });

  it("folds the substitute count into the Appearances card (TASK-M39)", () => {
    renderWithIntl(<PlayerSeasonStats metrics={metrics({ appearances: 35, subAppearances: 2 })} />);
    expect(screen.getByText("Appearances (Sub)")).toBeInTheDocument();
    expect(screen.getByText("(2)")).toBeInTheDocument();
  });

  it("is multi-open: opening a second category leaves the first one open", () => {
    renderWithIntl(<PlayerSeasonStats metrics={metrics({ appearances: 30, goals: 12 })} />);
    const playing = screen.getByRole("button", { name: /Playing time/i });
    const shooting = screen.getByRole("button", { name: /Shooting/i });
    // first populated category opens by default
    expect(playing).toHaveAttribute("aria-expanded", "true");
    expect(shooting).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(shooting);
    expect(shooting).toHaveAttribute("aria-expanded", "true");
    expect(playing).toHaveAttribute("aria-expanded", "true"); // NOT auto-closed
    fireEvent.click(playing); // closing one only flips that one
    expect(playing).toHaveAttribute("aria-expanded", "false");
    expect(shooting).toHaveAttribute("aria-expanded", "true");
  });

  it("plays the header wash only after a real toggle, never on mount (locale-switch glow fix)", () => {
    // Regression: a locale switch remounts this client component and resets
    // `open` to the default-open first category — the wash must NOT fire from
    // that (it flashed a glow on en↔ar switch). It fires only on a click.
    renderWithIntl(<PlayerSeasonStats metrics={metrics({ appearances: 30, goals: 12 })} />);
    const playing = screen.getByRole("button", { name: /Playing time/i });
    const shooting = screen.getByRole("button", { name: /Shooting/i });
    // default-open section is expanded but carries no wash on mount
    expect(playing).toHaveAttribute("aria-expanded", "true");
    expect(playing.className).not.toContain("statacc-wash--open");
    // a section the reader actually opens does wash
    fireEvent.click(shooting);
    expect(shooting.className).toContain("statacc-wash--open");
  });
});
