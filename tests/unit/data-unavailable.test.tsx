import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

import { DataUnavailable } from "@/components/DataUnavailable";

afterEach(() => {
  cleanup();
});

describe("DataUnavailable (TASK-703)", () => {
  it("renders the message and a default title as a status region", () => {
    render(<DataUnavailable message="No stats for this season." />);
    const card = screen.getByRole("status", { name: "Data unavailable" });
    expect(card).toBeInTheDocument();
    expect(screen.getByText("No stats for this season.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Data unavailable" })).toBeInTheDocument();
  });

  it("uses a custom title when provided", () => {
    render(<DataUnavailable title="Squad unavailable" message="No squad." />);
    expect(screen.getByRole("status", { name: "Squad unavailable" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Squad unavailable" })).toBeInTheDocument();
  });

  it("renders an optional CTA link", () => {
    render(
      <DataUnavailable
        message="No data."
        cta={{ href: "/players/123?season=2024", label: "View 2024-25 stats" }}
      />,
    );
    const link = screen.getByRole("link", { name: "View 2024-25 stats" });
    expect(link).toHaveAttribute("href", "/players/123?season=2024");
  });

  it("omits the CTA when none is given", () => {
    render(<DataUnavailable message="No data." />);
    expect(screen.queryByRole("link")).toBeNull();
  });
});
