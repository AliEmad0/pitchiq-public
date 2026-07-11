import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ImageZoom } from "@/components/ImageZoom";

afterEach(cleanup);

describe("ImageZoom", () => {
  it("renders the thumbnail trigger with a descriptive label", () => {
    render(
      <ImageZoom src="/logos/40.png" alt="Liverpool crest">
        <span>thumb</span>
      </ImageZoom>,
    );
    expect(screen.getByText("thumb")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /enlarge image: liverpool crest/i }),
    ).toBeInTheDocument();
  });

  it("opens a dialog showing the enlarged image on click", async () => {
    render(
      <ImageZoom src="/logos/40.png" alt="Liverpool crest">
        <span>thumb</span>
      </ImageZoom>,
    );
    await userEvent.click(screen.getByRole("button", { name: /enlarge image/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByAltText("Liverpool crest")).toBeInTheDocument();
  });
});
