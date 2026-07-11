import { afterEach, describe, expect, it } from "vitest";
import { cleanup, screen } from "@testing-library/react";
import { renderWithIntl } from "./_helpers/intl";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";

import { SeasonSwitcher } from "@/components/layout/SeasonSwitcher";
import { currentDataSeason, formatSeasonLabel } from "@/utils/season";

afterEach(() => {
  cleanup();
});

// The committed-season list the server `<SeasonSwitcherLoader>` would pass —
// newest-first, mirroring `data/_meta.json.seasons` (TASK-701/702).
const SEASONS = [2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017];

// Radix Select renders the chosen value inside the trigger button (the
// `aria-haspopup="listbox"` element). We assert on the trigger's text
// instead of opening the dropdown — happy-dom doesn't drive Radix's pointer
// portal reliably, and the open-list interaction is better covered by an
// E2E. The hook test below covers the URL-state round-trip.

describe("SeasonSwitcher", () => {
  it("defaults the trigger label to the current data season when no ?season= is set", () => {
    renderWithIntl(
      <NuqsTestingAdapter>
        <SeasonSwitcher seasons={SEASONS} />
      </NuqsTestingAdapter>,
    );
    const expected = formatSeasonLabel(currentDataSeason());
    expect(screen.getByRole("combobox", { name: "Season" })).toHaveTextContent(expected);
  });

  it("reflects the ?season= URL param on the trigger", () => {
    renderWithIntl(
      <NuqsTestingAdapter searchParams="?season=2018">
        <SeasonSwitcher seasons={SEASONS} />
      </NuqsTestingAdapter>,
    );
    expect(screen.getByRole("combobox", { name: "Season" })).toHaveTextContent("2018-19");
  });

  it("falls back to the current season when ?season= is non-numeric", () => {
    renderWithIntl(
      <NuqsTestingAdapter searchParams="?season=not-a-year">
        <SeasonSwitcher seasons={SEASONS} />
      </NuqsTestingAdapter>,
    );
    const expected = formatSeasonLabel(currentDataSeason());
    expect(screen.getByRole("combobox", { name: "Season" })).toHaveTextContent(expected);
  });
});
