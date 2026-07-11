import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ScrollToTop } from "@/components/ScrollToTop";

const mockPathname = vi.fn<() => string>();
vi.mock("next/navigation", () => ({ usePathname: () => mockPathname() }));

describe("ScrollToTop", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("scrolls to the top on mount and on a pathname change, but not on a same-path rerender", () => {
    const scrollTo = vi.fn();
    vi.stubGlobal("scrollTo", scrollTo);

    mockPathname.mockReturnValue("/teams");
    const { rerender } = render(<ScrollToTop />);
    expect(scrollTo).toHaveBeenCalledTimes(1); // mount

    // Rerender with the SAME path (e.g. a query-only change) → no scroll.
    rerender(<ScrollToTop />);
    expect(scrollTo).toHaveBeenCalledTimes(1);

    // Navigate to a new route → scroll to top.
    mockPathname.mockReturnValue("/players/1000741");
    rerender(<ScrollToTop />);
    expect(scrollTo).toHaveBeenCalledTimes(2);
    expect(scrollTo).toHaveBeenLastCalledWith(0, 0);
  });

  it("renders nothing", () => {
    vi.stubGlobal("scrollTo", vi.fn());
    mockPathname.mockReturnValue("/");
    const { container } = render(<ScrollToTop />);
    expect(container).toBeEmptyDOMElement();
  });
});
