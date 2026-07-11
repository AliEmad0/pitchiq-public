import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { renderWithIntl } from "./_helpers/intl";
import userEvent from "@testing-library/user-event";

import ar from "@/i18n/messages/ar.json";
import { TriviaCard } from "../../src/features/trivia/components/TriviaCard";
import type { TriviaFact } from "../../src/features/trivia/types";

function fact(id: string, text: string, sources: TriviaFact["sources"] = []): TriviaFact {
  return { id, scope: "league", rule: id, text, sources, verifiedAt: "t" };
}

const facts: TriviaFact[] = [
  fact("a", "Manchester City scored the most goals.", [{ kind: "standings", season: 2024 }]),
  fact("b", "Arsenal had the biggest win.", [{ kind: "fixtures", season: 2024 }]),
  fact("c", "Haaland reached a milestone.", [{ kind: "players", season: 2024 }]),
];

describe("TriviaCard", () => {
  it("renders the first fact with a provenance line", () => {
    renderWithIntl(<TriviaCard facts={facts} />);
    expect(screen.getByText("Manchester City scored the most goals.")).toBeInTheDocument();
    const provenance = screen.getByText(/2024-25/i);
    expect(provenance).toHaveTextContent(/standings/i);
  });

  it("cycles to the next fact when 'Surprise me' is clicked", async () => {
    const user = userEvent.setup();
    renderWithIntl(<TriviaCard facts={facts} />);
    expect(screen.getByText(/most goals/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /surprise me/i }));
    expect(screen.getByText(/biggest win/)).toBeInTheDocument();
    expect(screen.queryByText(/most goals/)).not.toBeInTheDocument();
  });

  it("loops back to the first fact after the last", async () => {
    const user = userEvent.setup();
    renderWithIntl(<TriviaCard facts={facts} />);
    const btn = screen.getByRole("button", { name: /surprise me/i });
    await user.click(btn); // b
    await user.click(btn); // c
    await user.click(btn); // back to a
    expect(screen.getByText(/most goals/)).toBeInTheDocument();
  });

  it("renders nothing when there are no facts", () => {
    const { container } = renderWithIntl(<TriviaCard facts={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("hides the shuffle control when there is only one fact", () => {
    renderWithIntl(<TriviaCard facts={[facts[0]]} />);
    expect(screen.queryByRole("button", { name: /surprise me/i })).not.toBeInTheDocument();
    expect(screen.getByText(/most goals/)).toBeInTheDocument();
  });

  it("renders the localized Arabic message with Eastern-Arabic digits on /ar (Arabic trivia)", () => {
    // A keyed fact renders `t(key, values)` on RTL instead of the English `text`;
    // numbers become Eastern-Arabic and `season` → the full season label.
    const keyed: TriviaFact = {
      id: "s",
      scope: "league",
      rule: "R24",
      text: "The last team to avoid relegation in 2024-25 stayed up on 41 points.",
      key: "factSurvival",
      values: { season: 2024, points: 41 },
      sources: [{ kind: "standings", season: 2024 }],
      verifiedAt: "t",
    };
    render(
      <NextIntlClientProvider locale="ar" messages={ar}>
        <TriviaCard facts={[keyed]} />
      </NextIntlClientProvider>,
    );
    // Arabic message body + localized number (41 → ٤١) + season label (٢٠٢٤ - ٢٠٢٥).
    const p = screen.getByText(/آخر فريق نجا من الهبوط/);
    expect(p).toHaveTextContent("٤١");
    expect(p).toHaveTextContent("٢٠٢٤ - ٢٠٢٥");
    // The English source-form text is NOT shown on /ar for a keyed fact.
    expect(screen.queryByText(/stayed up on 41 points/)).not.toBeInTheDocument();
  });

  it("falls back to English text on /ar for a fact with no key", () => {
    render(
      <NextIntlClientProvider locale="ar" messages={ar}>
        <TriviaCard facts={[facts[0]]} />
      </NextIntlClientProvider>,
    );
    expect(screen.getByText("Manchester City scored the most goals.")).toBeInTheDocument();
  });
});
