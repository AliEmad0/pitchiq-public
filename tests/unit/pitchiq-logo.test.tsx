import { afterEach, describe, expect, it } from "vitest";
import { cleanup, screen } from "@testing-library/react";

import { PitchIQLogo } from "@/components/brand/PitchIQLogo";
import { renderWithIntl } from "./_helpers/intl";

afterEach(() => {
  cleanup();
});

// PitchIQLogo reads useLocale() for the locale-aware wordmark, so it needs the
// intl provider — renderWithIntl defaults to the "en" catalog.
describe("PitchIQLogo", () => {
  it("renders the SVG mark", () => {
    const { container } = renderWithIntl(<PitchIQLogo />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders the English wordmark when withWordmark is set", () => {
    renderWithIntl(<PitchIQLogo withWordmark />);
    // "Pitch" and "IQ" are separate spans (IQ is accented) — match the full text.
    expect(screen.getByText(/Pitch/)).toBeInTheDocument();
    expect(screen.getByText("IQ")).toBeInTheDocument();
  });

  it("omits the wordmark by default", () => {
    renderWithIntl(<PitchIQLogo />);
    expect(screen.queryByText("IQ")).not.toBeInTheDocument();
  });
});
