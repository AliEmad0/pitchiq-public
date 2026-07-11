import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("next-themes", () => ({
  useTheme: vi.fn(),
}));

import { useTheme } from "next-themes";

import { ThemeToggle } from "@/components/layout/ThemeToggle";

import { renderWithIntl } from "./_helpers/intl";

const mockUseTheme = vi.mocked(useTheme);

function mockTheme(resolvedTheme: "light" | "dark", setTheme = vi.fn()) {
  mockUseTheme.mockReturnValue({
    resolvedTheme,
    setTheme,
    theme: resolvedTheme,
    themes: ["light", "dark", "system"],
    systemTheme: resolvedTheme,
    forcedTheme: undefined,
  });
  return setTheme;
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("ThemeToggle", () => {
  it("renders a button labelled to switch to dark theme when current theme is light", () => {
    mockTheme("light");
    renderWithIntl(<ThemeToggle />);

    expect(screen.getByRole("button", { name: "Switch to dark theme" })).toBeInTheDocument();
  });

  it("renders a button labelled to switch to light theme when current theme is dark", () => {
    mockTheme("dark");
    renderWithIntl(<ThemeToggle />);

    expect(screen.getByRole("button", { name: "Switch to light theme" })).toBeInTheDocument();
  });

  it("calls setTheme('dark') when clicked from light mode", async () => {
    const setTheme = mockTheme("light");
    const user = userEvent.setup();
    renderWithIntl(<ThemeToggle />);

    await user.click(screen.getByRole("button", { name: "Switch to dark theme" }));

    expect(setTheme).toHaveBeenCalledExactlyOnceWith("dark");
  });

  it("calls setTheme('light') when clicked from dark mode", async () => {
    const setTheme = mockTheme("dark");
    const user = userEvent.setup();
    renderWithIntl(<ThemeToggle />);

    await user.click(screen.getByRole("button", { name: "Switch to light theme" }));

    expect(setTheme).toHaveBeenCalledExactlyOnceWith("light");
  });
});
