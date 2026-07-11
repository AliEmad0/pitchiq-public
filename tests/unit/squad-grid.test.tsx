import { afterEach, describe, expect, it } from "vitest";
import { cleanup, screen, within } from "@testing-library/react";

import {
  SquadGrid,
  SquadGridSkeleton,
  groupSquadByPosition,
} from "@/features/teams/components/SquadGrid";
import type { SquadPlayer } from "@/types/api";

import { renderWithIntl } from "./_helpers/intl";

afterEach(() => {
  cleanup();
});

function p(
  id: number,
  name: string,
  position: SquadPlayer["position"],
  overrides: Partial<SquadPlayer> = {},
): SquadPlayer {
  return {
    id,
    name,
    age: 27,
    number: 10,
    position,
    photo: `https://media.example.test/football/players/${id}.png`,
    nationality: null,
    nationalityCode: null,
    birthDate: null,
    dateOfDeath: null,
    isCaptain: false,
    ...overrides,
  };
}

const baseSquad: SquadPlayer[] = [
  p(1, "André Onana", "Goalkeeper", { number: 24 }),
  p(2, "Tom Heaton", "Goalkeeper", { number: 22 }),
  p(3, "Lisandro Martínez", "Defender", { number: 6 }),
  p(4, "Harry Maguire", "Defender", { number: 5 }),
  p(5, "Bruno Fernandes", "Midfielder", { number: 8 }),
  p(6, "Casemiro", "Midfielder", { number: 18 }),
  p(7, "Rasmus Højlund", "Attacker", { number: 11 }),
  p(8, "Marcus Rashford", "Attacker", { number: 10 }),
];

describe("groupSquadByPosition", () => {
  it("buckets players into the four canonical positions", () => {
    const { groups, other } = groupSquadByPosition(baseSquad);
    expect(groups.Goalkeeper.map((x) => x.id)).toEqual([1, 2]);
    expect(groups.Defender.map((x) => x.id)).toEqual([3, 4]);
    expect(groups.Midfielder.map((x) => x.id)).toEqual([5, 6]);
    expect(groups.Attacker.map((x) => x.id)).toEqual([7, 8]);
    expect(other).toEqual([]);
  });

  it("preserves the input order within each group", () => {
    const reversed: SquadPlayer[] = [
      p(2, "Tom Heaton", "Goalkeeper"),
      p(1, "André Onana", "Goalkeeper"),
    ];
    const { groups } = groupSquadByPosition(reversed);
    expect(groups.Goalkeeper.map((x) => x.id)).toEqual([2, 1]);
  });

  it("bucks unknown / null positions into `other` rather than dropping them", () => {
    const squad: SquadPlayer[] = [
      p(1, "Mystery A", null),
      p(2, "Mystery B", "Coach"),
      p(3, "Real GK", "Goalkeeper"),
    ];
    const { groups, other } = groupSquadByPosition(squad);
    expect(groups.Goalkeeper.map((x) => x.id)).toEqual([3]);
    expect(other.map((x) => x.id)).toEqual([1, 2]);
  });

  it("returns empty groups when input is empty", () => {
    const { groups, other } = groupSquadByPosition([]);
    expect(groups.Goalkeeper).toEqual([]);
    expect(groups.Defender).toEqual([]);
    expect(groups.Midfielder).toEqual([]);
    expect(groups.Attacker).toEqual([]);
    expect(other).toEqual([]);
  });
});

describe("SquadGrid", () => {
  it("renders every player exactly once in the desktop photo-grid tree", () => {
    // TASK-1506: mobile is Radix Tabs (only the active position is mounted) +
    // desktop is the full-width position-grouped photo grid. Scope to the
    // desktop tree, which always renders every position group.
    const { container } = renderWithIntl(<SquadGrid season={2024} players={baseSquad} />);
    const desktop = container.querySelector(".md\\:block") as HTMLElement | null;
    expect(desktop).not.toBeNull();
    for (const player of baseSquad) {
      expect(within(desktop!).getAllByText(player.name).length).toBe(1);
    }
  });

  it("links each player card to /players/<id>", () => {
    const { container } = renderWithIntl(<SquadGrid season={2024} players={baseSquad} />);
    const desktop = container.querySelector(".md\\:block") as HTMLElement | null;
    const link = within(desktop!).getByRole("link", { name: /view bruno fernandes's profile/i });
    expect(link).toHaveAttribute("href", "/players/5?season=2024");
  });

  it("renders every player's shirt number badge", () => {
    renderWithIntl(<SquadGrid season={2024} players={baseSquad} />);
    // The Goalkeeper André Onana wears 24; the desktop column always
    // renders its 4 sections, so the badge text is always present.
    expect(screen.getAllByText("24").length).toBeGreaterThan(0);
    expect(screen.getAllByText("11").length).toBeGreaterThan(0);
  });

  it("renders the position tabs on mobile with short labels (TASK-1506)", () => {
    renderWithIntl(<SquadGrid season={2024} players={baseSquad} />);
    expect(screen.getByRole("tab", { name: "GK" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "DEF" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "MID" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "ATT" })).toBeTruthy();
  });

  it("renders a full-width heading for each position group on desktop", () => {
    renderWithIntl(<SquadGrid season={2024} players={baseSquad} />);
    expect(screen.getByRole("heading", { name: "Goalkeepers" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Defenders" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Midfielders" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Attackers" })).toBeTruthy();
  });

  it("renders an `Other` section when the squad has uncategorised entries", () => {
    const squad = [...baseSquad, p(99, "Coach Erik", "Coach")];
    renderWithIntl(<SquadGrid season={2024} players={squad} />);
    expect(screen.getAllByText("Coach Erik").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("heading", { name: "Other" }).length).toBeGreaterThan(0);
  });

  it("renders the player's age caption when age is provided", () => {
    renderWithIntl(
      <SquadGrid season={2024} players={[p(1, "Onana", "Goalkeeper", { age: 28 })]} />,
    );
    expect(screen.getAllByText("age 28").length).toBeGreaterThan(0);
  });

  it("omits the age caption when age is null", () => {
    renderWithIntl(
      <SquadGrid season={2024} players={[p(1, "Mystery", "Goalkeeper", { age: null })]} />,
    );
    expect(screen.queryByText(/^age /)).toBeNull();
  });

  it("renders the player's nationality flag when known (TASK-M15)", () => {
    renderWithIntl(
      <SquadGrid
        season={2024}
        players={[p(1, "Salah", "Attacker", { nationality: "Egypt", nationalityCode: "eg" })]}
      />,
    );
    expect(screen.getAllByRole("img", { name: "Egypt" }).length).toBeGreaterThan(0);
  });

  it("renders the captain badge on the captain's card (TASK-M41)", () => {
    renderWithIntl(
      <SquadGrid
        season={2024}
        players={[p(5, "Bruno Fernandes", "Midfielder", { isCaptain: true })]}
      />,
    );
    expect(screen.getAllByRole("img", { name: "Club captain" }).length).toBeGreaterThan(0);
  });

  it("renders no captain badge for a non-captain", () => {
    renderWithIntl(<SquadGrid season={2024} players={[p(1, "Onana", "Goalkeeper")]} />);
    expect(screen.queryByRole("img", { name: "Club captain" })).toBeNull();
  });

  it("renders the deceased treatment (mourning ribbon) on the card (TASK-M40)", () => {
    const { container } = renderWithIntl(
      <SquadGrid
        season={2024}
        players={[
          p(1, "Diogo Jota", "Attacker", {
            age: 28,
            birthDate: "1996-12-04",
            dateOfDeath: "2025-07-03",
          }),
        ]}
      />,
    );
    expect(container.querySelectorAll('[data-testid="mourning-ribbon"]').length).toBeGreaterThan(0);
    expect(screen.getAllByText("age 28").length).toBeGreaterThan(0); // frozen at death
  });

  it("omits the flag when nationality is unknown but keeps age", () => {
    renderWithIntl(
      <SquadGrid
        season={2024}
        players={[p(1, "Mystery", "Attacker", { age: 25, nationalityCode: null })]}
      />,
    );
    expect(screen.queryAllByRole("img", { name: "Egypt" }).length).toBe(0);
    expect(screen.getAllByText("age 25").length).toBeGreaterThan(0);
  });

  it("omits the number badge when number is null", () => {
    const { container } = renderWithIntl(
      <SquadGrid season={2024} players={[p(1, "NoNumber", "Goalkeeper", { number: null })]} />,
    );
    // Badge text "10" would normally appear (default in the factory). With
    // number=null override, the badge isn't rendered at all.
    expect(within(container).queryByText("10")).toBeNull();
  });

  it("falls back to initials when photo is null", () => {
    renderWithIntl(
      <SquadGrid
        season={2024}
        players={[p(1, "Cristiano Ronaldo", "Attacker", { photo: null })]}
      />,
    );
    expect(screen.getAllByText("CR").length).toBeGreaterThan(0);
  });

  it("renders an empty-state message in a position with no players", () => {
    // Only goalkeepers — defender/midfielder/attacker columns render
    // "No players." instead of being silently empty.
    renderWithIntl(<SquadGrid season={2024} players={[p(1, "Onana", "Goalkeeper")]} />);
    const empties = screen.getAllByText("No players.");
    expect(empties.length).toBe(3); // Defender, Midfielder, Attacker
  });
});

describe("SquadGridSkeleton", () => {
  it("renders a loading status region for each position group", () => {
    const { container } = renderWithIntl(<SquadGridSkeleton />);
    // One status region per position group (Goalkeepers / Defenders / … ).
    const statuses = container.querySelectorAll('[role="status"]');
    expect(statuses.length).toBeGreaterThanOrEqual(4);
  });
});
