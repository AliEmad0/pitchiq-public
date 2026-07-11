import { cleanup, fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const replace = vi.fn();
vi.mock("@/i18n/navigation", () => ({
  usePathname: () => "/teams",
  useRouter: () => ({ replace }),
}));
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("season=2004"),
}));

import { LocaleSwitcher } from "@/components/layout/LocaleSwitcher";

import { renderWithIntl } from "./_helpers/intl";

afterEach(() => {
  cleanup();
  replace.mockClear();
});

describe("LocaleSwitcher", () => {
  it("from English, offers Arabic and switches, preserving path + season", () => {
    renderWithIntl(<LocaleSwitcher />, "en");
    fireEvent.click(screen.getByRole("button", { name: /العربية/ }));
    expect(replace).toHaveBeenCalledWith(
      { pathname: "/teams", query: { season: "2004" } },
      { locale: "ar" },
    );
  });

  it("from Arabic, offers English", () => {
    renderWithIntl(<LocaleSwitcher />, "ar");
    fireEvent.click(screen.getByRole("button", { name: /Switch to English/i }));
    expect(replace).toHaveBeenCalledWith(
      { pathname: "/teams", query: { season: "2004" } },
      { locale: "en" },
    );
  });
});
