import { describe, expect, it } from "vitest";

import type { SearchIndex } from "@/data/schemas";
import {
  addArNames,
  buildNameMap,
  localizeFactNames,
  localizeNameValue,
} from "@/features/trivia/localize-names";
import type { TriviaFact } from "@/features/trivia/types";

// Minimal search-index stub — buildNameMap only reads name/nameAr.
const INDEX = {
  teams: [
    { name: "Arsenal", nameAr: "آرسنال" },
    { name: "Manchester City", nameAr: "مانشستر سيتي" },
    { name: "Brighton & Hove Albion", nameAr: "برايتون أند هوف ألبيون" },
    { name: "Fulham" }, // no Arabic → not added
  ],
  players: [{ name: "Gabriel Jesus", nameAr: "غابرييل جيسوس" }],
  managers: [
    { name: "Graham Potter", nameAr: "غراهام بوتر" },
    { name: "Frank Lampard", nameAr: "فرانك لامبارد" },
  ],
} as unknown as SearchIndex;

const map = buildNameMap(INDEX);

describe("buildNameMap", () => {
  it("maps Latin → Arabic and skips entries without a distinct nameAr", () => {
    expect(map.get("Arsenal")).toBe("آرسنال");
    expect(map.get("Gabriel Jesus")).toBe("غابرييل جيسوس");
    expect(map.get("Graham Potter")).toBe("غراهام بوتر");
    expect(map.has("Fulham")).toBe(false); // no nameAr
  });
});

describe("localizeNameValue", () => {
  it("localizes a single entity by whole-string match", () => {
    expect(localizeNameValue("Manchester City", map)).toBe("مانشستر سيتي");
  });

  it("passes an unknown name through unchanged (graceful Latin fallback)", () => {
    expect(localizeNameValue("Fulham", map)).toBe("Fulham");
    expect(localizeNameValue("Some Reserve XI", map)).toBe("Some Reserve XI");
  });

  it("matches a club name that itself contains a separator (whole-string wins first)", () => {
    // "Brighton & Hove Albion" must NOT be split on the " & ".
    expect(localizeNameValue("Brighton & Hove Albion", map)).toBe("برايتون أند هوف ألبيون");
  });

  it("localizes an English-joined list, rejoining with the Arabic conjunction", () => {
    expect(localizeNameValue("Graham Potter and Frank Lampard", map)).toBe(
      "غراهام بوتر وفرانك لامبارد",
    );
  });

  it("keeps a partly-unknown list Latin (only rejoins when EVERY part is known)", () => {
    expect(localizeNameValue("Graham Potter and Unknown Man", map)).toBe(
      "Graham Potter and Unknown Man",
    );
  });
});

describe("addArNames", () => {
  it("adds team short-name + venue variants the canonical index lacks", () => {
    const m = buildNameMap(INDEX); // has "Manchester City" canonical
    addArNames(m, [
      ["Man United", "مانشستر يونايتد"], // fixture short form
      ["Leeds", "ليدز يونايتد"],
      ["Old Trafford", "ملعب أولد ترافورد"], // venue (not in the index)
    ]);
    expect(localizeNameValue("Man United", m)).toBe("مانشستر يونايتد");
    expect(localizeNameValue("Leeds", m)).toBe("ليدز يونايتد");
    expect(localizeNameValue("Old Trafford", m)).toBe("ملعب أولد ترافورد");
  });

  it("does not overwrite an existing canonical entry, and skips null/same/empty", () => {
    const m = new Map<string, string>([["Arsenal", "آرسنال"]]);
    addArNames(m, [
      ["Arsenal", "شيء آخر"], // already present → keep canonical
      ["Fulham", null], // no Arabic → skip
      ["Chelsea", "Chelsea"], // same as Latin → skip
      [null, "x"], // null latin → skip
      ["", "y"], // empty latin → skip
    ]);
    expect(m.get("Arsenal")).toBe("آرسنال");
    expect(m.has("Fulham")).toBe(false);
    expect(m.has("Chelsea")).toBe(false);
    expect(m.size).toBe(1);
  });
});

describe("localizeFactNames", () => {
  const fact = (values: TriviaFact["values"]): TriviaFact => ({
    id: "x",
    scope: "league",
    rule: "R1",
    text: "en",
    key: "factX",
    values,
    sources: [],
    verifiedAt: "2026-01-01T00:00:00Z",
  });

  it("localizes string values, leaves numbers, and preserves other fields", () => {
    const [out] = localizeFactNames([fact({ team: "Arsenal", run: 18, season: 2025 })], map);
    expect(out.values).toEqual({ team: "آرسنال", run: 18, season: 2025 });
    expect(out.text).toBe("en");
    expect(out.key).toBe("factX");
  });

  it("leaves a fact with no values untouched, and no-ops on an empty map", () => {
    const noValues: TriviaFact = { ...fact({ team: "Arsenal" }), values: undefined };
    expect(localizeFactNames([noValues], map)[0]).toBe(noValues);
    // Empty map (e.g. index missing) → identity.
    const facts = [fact({ team: "Arsenal" })];
    expect(localizeFactNames(facts, new Map())).toBe(facts);
  });
});
