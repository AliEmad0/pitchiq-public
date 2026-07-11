import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { StatRow } from "@/features/players/components/StatRow";
import { renderWithIntl as render } from "./_helpers/intl";

afterEach(() => {
  cleanup();
});

// Helpers — the bar halves are positioned via inline `width: NN%`. Read
// the style attribute back to assert on the split. data-testid names
// match the implementation slots.
function aBarWidth(): string | undefined {
  return screen.getByTestId("stat-row-bar-a").style.width;
}
function bBarWidth(): string | undefined {
  return screen.getByTestId("stat-row-bar-b").style.width;
}

describe("StatRow", () => {
  it("renders the label", () => {
    render(<StatRow label="Goals" a={5} b={5} />);
    expect(screen.getByText("Goals")).toBeInTheDocument();
  });

  it("renders 50/50 widths when a === b (no winner highlight)", () => {
    render(<StatRow label="Goals" a={5} b={5} />);
    expect(aBarWidth()).toBe("50%");
    expect(bBarWidth()).toBe("50%");
    // No winner → neither number is bold and there's no +X chip.
    expect(screen.queryByText(/^\+\d+$/)).not.toBeInTheDocument();
  });

  it("renders a flat 50/50 neutral bar when a + b === 0 (no division-by-zero)", () => {
    render(<StatRow label="Goals" a={0} b={0} />);
    expect(aBarWidth()).toBe("50%");
    expect(bBarWidth()).toBe("50%");
    // Both rendered as "0", not "—". 0 is a measured value.
    expect(screen.getAllByText("0")).toHaveLength(2);
  });

  it("renders flat neutral with em-dashes when either side is null (not measured)", () => {
    render(<StatRow label="Pass accuracy" a={null} b={80} />);
    expect(aBarWidth()).toBe("50%");
    expect(bBarWidth()).toBe("50%");
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.getByText("80")).toBeInTheDocument();
    // No winner declared when either value is missing.
    expect(screen.queryByText(/^\+\d+$/)).not.toBeInTheDocument();
  });

  it("splits the bar by a/(a+b) when a > b and highlights a as the winner", () => {
    render(<StatRow label="Goals" a={30} b={10} />);
    expect(aBarWidth()).toBe("75%");
    expect(bBarWidth()).toBe("25%");

    // Winner's number is bold (font-bold class), the loser's isn't.
    expect(screen.getByText("30")).toHaveClass("font-bold");
    expect(screen.getByText("10")).not.toHaveClass("font-bold");

    // The "+X" delta chip surfaces on the winner side.
    expect(screen.getByText("+20")).toBeInTheDocument();
  });

  it("mirrors the split + winner highlight when b > a", () => {
    render(<StatRow label="Goals" a={6} b={18} />);
    expect(aBarWidth()).toBe("25%");
    expect(bBarWidth()).toBe("75%");
    expect(screen.getByText("18")).toHaveClass("font-bold");
    expect(screen.getByText("6")).not.toHaveClass("font-bold");
    expect(screen.getByText("+12")).toBeInTheDocument();
  });

  it("uses the optional `format` function to render values (e.g., 78.4% for pass accuracy)", () => {
    const percent = (n: number) => `${n.toFixed(1)}%`;
    render(<StatRow label="Pass accuracy" a={78.4} b={82.1} format={percent} />);
    expect(screen.getByText("78.4%")).toBeInTheDocument();
    expect(screen.getByText("82.1%")).toBeInTheDocument();
  });

  it("formats the +X delta chip with the same format function when provided", () => {
    // For pass accuracy, a +3.7% delta should read "+3.7%", not "+3.7".
    const percent = (n: number) => `${n.toFixed(1)}%`;
    render(<StatRow label="Pass accuracy" a={78.4} b={82.1} format={percent} />);
    expect(screen.getByText("+3.7%")).toBeInTheDocument();
  });

  it("defaults to String(n) when no format function is provided", () => {
    render(<StatRow label="Goals" a={23} b={19} />);
    expect(screen.getByText("23")).toBeInTheDocument();
    expect(screen.getByText("19")).toBeInTheDocument();
    expect(screen.getByText("+4")).toBeInTheDocument();
  });
});
