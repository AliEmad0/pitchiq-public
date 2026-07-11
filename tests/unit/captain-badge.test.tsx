import { describe, it, expect } from "vitest";

import { renderWithIntl } from "./_helpers/intl";
import { CaptainBadge } from "@/features/players/components/CaptainBadge";

describe("<CaptainBadge>", () => {
  it("renders a 'C' with an accessible 'Club captain' label", () => {
    const { getByRole } = renderWithIntl(<CaptainBadge />);
    const el = getByRole("img", { name: "Club captain" });
    expect(el.textContent).toBe("C");
  });
});
