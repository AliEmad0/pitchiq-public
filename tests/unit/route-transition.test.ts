import { describe, expect, it } from "vitest";

import { armArrival, interceptNavClick, settleArrival } from "@/utils/route-transition";

const CURRENT = "http://localhost:3000/teams?season=2024";

function click(overrides: Record<string, unknown> = {}, anchor: Record<string, unknown> = {}) {
  return {
    button: 0,
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    defaultPrevented: false,
    currentTarget: {
      href: "http://localhost:3000/players/1001119?season=2024",
      target: "",
      hasAttribute: () => false,
      ...anchor,
    },
    ...overrides,
  };
}

describe("interceptNavClick (TASK-1703 zoom-fade route transitions)", () => {
  it("returns the app-relative href for a plain internal left-click", () => {
    expect(interceptNavClick(click(), CURRENT)).toBe("/players/1001119?season=2024");
  });

  it("keeps the hash on the returned href", () => {
    expect(
      interceptNavClick(click({}, { href: "http://localhost:3000/teams/42#squad" }), CURRENT),
    ).toBe("/teams/42#squad");
  });

  it("skips defaultPrevented events (a caller onClick opted out)", () => {
    expect(interceptNavClick(click({ defaultPrevented: true }), CURRENT)).toBeNull();
  });

  it("skips non-left buttons and modified clicks (new-tab gestures)", () => {
    expect(interceptNavClick(click({ button: 1 }), CURRENT)).toBeNull();
    expect(interceptNavClick(click({ metaKey: true }), CURRENT)).toBeNull();
    expect(interceptNavClick(click({ ctrlKey: true }), CURRENT)).toBeNull();
    expect(interceptNavClick(click({ shiftKey: true }), CURRENT)).toBeNull();
    expect(interceptNavClick(click({ altKey: true }), CURRENT)).toBeNull();
  });

  it("skips targeted and download anchors", () => {
    expect(interceptNavClick(click({}, { target: "_blank" }), CURRENT)).toBeNull();
    expect(interceptNavClick(click({}, { hasAttribute: () => true }), CURRENT)).toBeNull();
  });

  it("allows an explicit target=_self", () => {
    expect(interceptNavClick(click({}, { target: "_self" }), CURRENT)).not.toBeNull();
  });

  it("skips cross-origin and non-string (SVG) hrefs", () => {
    expect(
      interceptNavClick(click({}, { href: "https://github.com/AliEmad0/pitchiq" }), CURRENT),
    ).toBeNull();
    expect(interceptNavClick(click({}, { href: { baseVal: "/x" } }), CURRENT)).toBeNull();
    expect(interceptNavClick(click({}, { href: "" }), CURRENT)).toBeNull();
  });

  it("skips a click onto the SAME pathname+search (active nav item must not zoom)", () => {
    expect(
      interceptNavClick(click({}, { href: "http://localhost:3000/teams?season=2024" }), CURRENT),
    ).toBeNull();
    expect(
      interceptNavClick(
        click({}, { href: "http://localhost:3000/teams?season=2024#top" }),
        CURRENT,
      ),
    ).toBeNull();
  });

  it("intercepts a query-only change (season switch links)", () => {
    expect(
      interceptNavClick(click({}, { href: "http://localhost:3000/teams?season=1996" }), CURRENT),
    ).toBe("/teams?season=1996");
  });
});

describe("arrival registry", () => {
  it("settle resolves the armed callback exactly once", () => {
    let calls = 0;
    armArrival(() => {
      calls += 1;
    });
    settleArrival();
    settleArrival();
    expect(calls).toBe(1);
  });

  it("arming a new arrival replaces the previous one", () => {
    let first = 0;
    let second = 0;
    armArrival(() => {
      first += 1;
    });
    armArrival(() => {
      second += 1;
    });
    settleArrival();
    expect(first).toBe(0);
    expect(second).toBe(1);
  });

  it("settle with nothing armed is a no-op", () => {
    expect(() => settleArrival()).not.toThrow();
  });
});
