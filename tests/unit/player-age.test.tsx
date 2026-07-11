import { describe, it, expect } from "vitest";
import { PlayerAge } from "@/features/players/components/PlayerAge";
import { renderWithIntl as render } from "./_helpers/intl";

describe("<PlayerAge>", () => {
  it("renders a frozen age for a deceased player (does not recompute)", () => {
    const { getByText } = render(
      <PlayerAge age={28} birthDate="1996-12-04" dateOfDeath="2025-07-03" />,
    );
    expect(getByText("Age 28")).toBeInTheDocument();
  });

  it("renders a live age for a living player", () => {
    const { container } = render(<PlayerAge age={34} birthDate="1992-06-15" dateOfDeath={null} />);
    // After mount it recomputes against today — assert the shape, not a fixed value.
    expect(container.textContent).toMatch(/Age \d+/);
  });

  it("supports a lowercase prefix (squad cards)", () => {
    const { getByText } = render(
      <PlayerAge age={28} birthDate="1996-12-04" dateOfDeath="2025-07-03" prefix="age " />,
    );
    expect(getByText("age 28")).toBeInTheDocument();
  });

  it("renders nothing when age is null", () => {
    const { container } = render(<PlayerAge age={null} birthDate={null} dateOfDeath={null} />);
    expect(container.firstChild).toBeNull();
  });
});
