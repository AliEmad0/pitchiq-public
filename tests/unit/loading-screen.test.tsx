import { describe, expect, it } from "vitest";

import { LoadingScreen, BOOT_SESSION_KEY } from "@/components/LoadingScreen";

import { renderWithIntl } from "./_helpers/intl";

describe("LoadingScreen (TASK-1702 neon wordmark-draw boot loader)", () => {
  it("renders the decorative overlay with the neon wordmark + progress rail", () => {
    const { container } = renderWithIntl(<LoadingScreen />);
    const overlay = container.querySelector("#boot-loader");
    expect(overlay).not.toBeNull();
    expect(overlay).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector(".boot-neon-text")?.textContent).toBe("PitchIQ");
    expect(container.querySelector(".boot-rail-fill")).not.toBeNull();
  });

  it("embeds the once-per-session gate + scroll-lock script", () => {
    const { container } = renderWithIntl(<LoadingScreen />);
    const script = container.querySelector("#boot-loader script");
    expect(script).not.toBeNull();
    expect(script?.innerHTML).toContain(BOOT_SESSION_KEY);
    expect(script?.innerHTML).toContain("sessionStorage");
    expect(script?.innerHTML).toContain("dataset.booted");
    expect(script?.innerHTML).toContain("boot-lock");
    expect(script?.innerHTML).toContain("boot-exit");
  });
});
