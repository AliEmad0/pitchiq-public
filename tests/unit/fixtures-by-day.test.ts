import { describe, expect, it } from "vitest";

import {
  formatMatchdayHeading,
  groupFixturesByDay,
  londonDayKey,
} from "@/features/leagues/fixtures-by-day";
import type { Fixture } from "@/types/api";

// Only `fixture.date` (+ id, for ordering assertions) matters to the grouping
// helper, so a minimal cast keeps the fixtures readable.
function fx(id: string, date: string): Fixture {
  return { fixture: { id, date } } as unknown as Fixture;
}

describe("londonDayKey", () => {
  it("returns the London calendar date (YYYY-MM-DD)", () => {
    expect(londonDayKey("2025-08-16T14:00:00Z")).toBe("2025-08-16");
  });

  it("rolls a late-night UTC kickoff into the next London day (BST)", () => {
    // 23:30Z in August = 00:30 BST the next day.
    expect(londonDayKey("2025-08-16T23:30:00Z")).toBe("2025-08-17");
  });
});

describe("formatMatchdayHeading", () => {
  it("formats a day key as a human heading", () => {
    expect(formatMatchdayHeading("2025-08-16")).toMatch(/Saturday.*16 August 2025/);
  });

  it("localizes to Arabic month/weekday names with Eastern-Arabic digits", () => {
    const h = formatMatchdayHeading("2025-08-16", "ar");
    expect(h).toContain("أغسطس"); // August
    expect(h).toContain("٢٠٢٥");
    expect(h).toContain("١٦");
  });

  it("passes locale through groupFixturesByDay to the heading", () => {
    const [group] = groupFixturesByDay([fx("a", "2025-08-16T11:30:00Z")], { locale: "ar" });
    expect(group.heading).toContain("أغسطس");
  });
});

describe("groupFixturesByDay", () => {
  it("groups fixtures by London day, ordered chronologically", () => {
    const groups = groupFixturesByDay([
      fx("c", "2025-08-23T14:00:00Z"),
      fx("a", "2025-08-16T11:30:00Z"),
      fx("b", "2025-08-16T14:00:00Z"),
    ]);

    expect(groups.map((g) => g.key)).toEqual(["2025-08-16", "2025-08-23"]);
    expect(groups[0].fixtures.map((f) => f.fixture.id)).toEqual(["a", "b"]);
    expect(groups[1].fixtures.map((f) => f.fixture.id)).toEqual(["c"]);
  });

  it("attaches a heading to each group", () => {
    const [group] = groupFixturesByDay([fx("a", "2025-08-16T11:30:00Z")]);
    expect(group.heading).toMatch(/16 August 2025/);
  });

  it("orders days newest-first when order is 'desc' (TASK-M36)", () => {
    const groups = groupFixturesByDay(
      [
        fx("a", "2025-08-16T11:30:00Z"),
        fx("c", "2025-08-23T14:00:00Z"),
        fx("b", "2025-08-16T14:00:00Z"),
      ],
      { order: "desc" },
    );
    expect(groups.map((g) => g.key)).toEqual(["2025-08-23", "2025-08-16"]);
    // Within a day, kickoff order is preserved.
    expect(groups[1].fixtures.map((f) => f.fixture.id)).toEqual(["a", "b"]);
  });

  it("returns an empty array for no fixtures", () => {
    expect(groupFixturesByDay([])).toEqual([]);
  });
});
