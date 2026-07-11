import { fireEvent, screen } from "@testing-library/react";
import { renderWithIntl } from "./_helpers/intl";
import { describe, expect, it, vi } from "vitest";

import { SeasonSlider } from "@/features/map/components/SeasonSlider";

describe("SeasonSlider", () => {
  const seasons = [1992, 1993, 1994, 2024, 2025]; // ascending

  it("renders the season label + active count and the range at the right index", () => {
    renderWithIntl(
      <SeasonSlider seasons={seasons} season={2025} activeCount={20} onSeason={vi.fn()} />,
    );
    // "2025-26" shows both as the readout and as the range's right-end label.
    expect(screen.getAllByText("2025-26").length).toBeGreaterThan(0);
    expect(screen.getByText(/20 of 51/)).toBeInTheDocument();
    expect(screen.getByRole("slider")).toHaveValue("4"); // index of 2025
  });

  it("calls onSeason with the season at the dragged index", () => {
    const onSeason = vi.fn();
    renderWithIntl(
      <SeasonSlider seasons={seasons} season={2025} activeCount={20} onSeason={onSeason} />,
    );
    fireEvent.change(screen.getByRole("slider"), { target: { value: "0" } });
    expect(onSeason).toHaveBeenCalledWith(1992);
  });
});
