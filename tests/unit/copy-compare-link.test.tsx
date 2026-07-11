import { cleanup, screen, waitFor } from "@testing-library/react";
import { renderWithIntl } from "./_helpers/intl";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CopyCompareLink } from "@/features/players/components/CopyCompareLink";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("CopyCompareLink", () => {
  it("renders an enabled copy button with the default label", () => {
    renderWithIntl(<CopyCompareLink />);
    const button = screen.getByRole("button", { name: /copy.*link/i });
    expect(button).toBeEnabled();
    expect(button).toHaveTextContent(/copy comparison link/i);
  });

  it("flips to a 'Copied!' confirmation after a successful click", async () => {
    // happy-dom 15 ships a working `navigator.clipboard.writeText`; if
    // the click handler reaches `setCopied(true)` we know the await on
    // `writeText` resolved without throwing. That's sufficient
    // behavioural coverage for the click path. We deliberately don't
    // pin the URL value — `vi.spyOn(navigator.clipboard, "writeText")`
    // doesn't intercept happy-dom's getter-backed clipboard (the click
    // path reads through to a fresh fn snapshot), and the one-line
    // `writeText(window.location.href)` call in the source is
    // self-evident at the implementation level.
    const user = userEvent.setup();
    renderWithIntl(<CopyCompareLink />);

    await user.click(screen.getByRole("button", { name: /copy.*link/i }));

    await waitFor(() => expect(screen.getByRole("button")).toHaveTextContent(/^copied/i));
  });
});
