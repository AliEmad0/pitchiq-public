import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Flag } from "@/features/players/components/Flag";

describe("<Flag>", () => {
  it("renders a flag-icons span with the country as accessible name", () => {
    const { getByRole } = render(<Flag code="eg" name="Egypt" />);
    const el = getByRole("img", { name: "Egypt" });
    expect(el.className).toContain("fi");
    expect(el.className).toContain("fi-eg");
  });

  it("supports GB subdivision codes", () => {
    const { getByRole } = render(<Flag code="gb-eng" name="England" />);
    expect(getByRole("img", { name: "England" }).className).toContain("fi-gb-eng");
  });

  it("renders nothing when code is null", () => {
    const { container } = render(<Flag code={null} name={null} />);
    expect(container.firstChild).toBeNull();
  });
});
