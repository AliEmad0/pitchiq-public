import { describe, expect, it } from "vitest";

import { LineupsFileSchema, EventsFileSchema } from "@/data/schemas";

describe("LineupsFileSchema", () => {
  it("accepts a valid lineups file keyed by fixture id", () => {
    const data = {
      "2025-08-15-LIV-BOU": {
        home: {
          teamId: 40,
          formation: "4-3-3",
          startXI: [
            { id: 1460541, name: "Mohamed Salah", number: 11, pos: "Right Wing", grid: "5:3" },
          ],
          substitutes: [
            { id: 1467371, name: "Federico Chiesa", number: 14, pos: null, grid: null },
          ],
        },
        away: { teamId: 35, formation: "", startXI: [], substitutes: [] },
      },
    };
    expect(() => LineupsFileSchema.parse(data)).not.toThrow();
  });

  it("rejects a lineup player missing a numeric id", () => {
    const bad = {
      f1: {
        home: {
          teamId: 1,
          formation: "",
          startXI: [{ name: "X", number: null, pos: null, grid: null }],
          substitutes: [],
        },
        away: { teamId: 2, formation: "", startXI: [], substitutes: [] },
      },
    };
    expect(() => LineupsFileSchema.parse(bad)).toThrow();
  });
});

describe("EventsFileSchema", () => {
  it("accepts a valid events file keyed by fixture id", () => {
    const data = {
      "2025-08-15-LIV-BOU": [
        {
          type: "Goal",
          detail: "Normal Goal",
          minute: 37,
          extra: null,
          teamId: 40,
          player: "Mohamed Salah",
          assist: "Alexis Mac Allister",
        },
        {
          type: "Card",
          detail: "Yellow Card",
          minute: 52,
          extra: 2,
          teamId: 35,
          player: "Player X",
          assist: null,
        },
      ],
    };
    expect(() => EventsFileSchema.parse(data)).not.toThrow();
  });
});
