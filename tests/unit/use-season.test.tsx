import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";

import { useSeason } from "@/hooks/useSeason";
import { currentDataSeason } from "@/utils/season";

afterEach(() => {
  cleanup();
});

// Minimal consumer that exposes the hook's state to the DOM and offers a
// button to drive `setSeason`. Bypasses Radix Select's portal so we can
// exercise the read + write paths without depending on pointer events.
// `setSeason` returns a Promise (nuqs flushes router updates async), so
// the click handler awaits it before resolving — combine with `await
// act(async ...)` in the test to flush microtasks.
function SeasonProbe({ next }: { next: number }) {
  const [season, setSeason] = useSeason();
  return (
    <div>
      <span data-testid="value">{season}</span>
      <button
        type="button"
        onClick={async () => {
          await setSeason(next);
        }}
      >
        set
      </button>
    </div>
  );
}

describe("useSeason", () => {
  it("defaults to the current data season when no ?season= is set", () => {
    render(
      <NuqsTestingAdapter>
        <SeasonProbe next={2020} />
      </NuqsTestingAdapter>,
    );
    expect(screen.getByTestId("value").textContent).toBe(String(currentDataSeason()));
  });

  it("reads the initial value from the URL", () => {
    render(
      <NuqsTestingAdapter searchParams="?season=2018">
        <SeasonProbe next={2020} />
      </NuqsTestingAdapter>,
    );
    expect(screen.getByTestId("value").textContent).toBe("2018");
  });

  it("writes the chosen season into the URL via setSeason", async () => {
    render(
      <NuqsTestingAdapter>
        <SeasonProbe next={2020} />
      </NuqsTestingAdapter>,
    );
    // Sanity-check the starting state — default branch (no ?season=)
    expect(screen.getByTestId("value").textContent).toBe(String(currentDataSeason()));
    await act(async () => {
      screen.getByRole("button", { name: "set" }).click();
    });
    // After the round-trip nuqs flushes the new value back into the hook
    expect(screen.getByTestId("value").textContent).toBe("2020");
  });

  it("drops ?season= from the URL when the user picks the current (default) season", async () => {
    const onUrlUpdate = vi.fn();
    render(
      <NuqsTestingAdapter searchParams="?season=2018" onUrlUpdate={onUrlUpdate}>
        <SeasonProbe next={currentDataSeason()} />
      </NuqsTestingAdapter>,
    );
    await act(async () => {
      screen.getByRole("button", { name: "set" }).click();
    });
    const lastCall = onUrlUpdate.mock.calls.at(-1)?.[0];
    expect(lastCall?.queryString ?? "").not.toContain("season=");
  });
});
