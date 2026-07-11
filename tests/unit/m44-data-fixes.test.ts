import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import type { Player } from "@/data/schemas";

// TASK-M44 — Jota Silva split merge, DOB fills, short-name fixes, and photos,
// asserted against the committed data.
const load = (season: number): Player[] =>
  JSON.parse(readFileSync(join(process.cwd(), "data", `players-${season}.json`), "utf8"));

describe("TASK-M44 data fixes", () => {
  const p2024 = load(2024);
  const p2025 = load(2025);
  const at = (ps: Player[], id: number) => ps.find((p) => p.id === id);

  it("merges Jota Silva (1001851 → 1000818) across 2024 + 2025", () => {
    expect(at(p2024, 1000818)?.name).toBe("Jota Silva");
    expect(at(p2025, 1000818)?.name).toBe("Jota Silva");
    expect(p2025.some((p) => p.id === 1001851)).toBe(false); // old split id gone
    expect(p2025.some((p) => p.name === "João Pedro Ferreira da Silva")).toBe(false);
  });

  it("fills dates of birth from the source", () => {
    expect(at(p2025, 1001394)?.birthDate).toBe("2004-04-10"); // Savinho
    expect(at(p2024, 1001394)?.birthDate).toBe("2004-04-10"); // also his 2024-25 season
    expect(at(p2025, 1001837)?.birthDate).toBe("2007-08-22"); // Divine Mukasa
    expect(at(p2025, 1001854)?.birthDate).toBe("2009-06-09"); // Joél Drakes-Thomas
  });

  it("shortens long legal names", () => {
    expect(at(p2025, 1001852)?.name).toBe("Souza"); // was João Victor de Souza Menezes
    expect(at(p2025, 1001838)?.name).toBe("Jocelin Ta Bi"); // was Djiamgone Jocelin Ta Bi
  });

  it("fills Souza's DOB + corrects his appearances from the source", () => {
    const souza = at(p2025, 1001852);
    expect(souza?.birthDate).toBe("2006-06-16");
    expect(souza?.metrics.appearances).toBe(4); // the source shows 4 (the earlier snapshot had 1)
    expect(souza?.metrics.yellowCards).toBe(1);
  });

  it("applies the corrected photos (photo code + portrait URL)", () => {
    expect(at(load(2023), 1001101)?.photo).toBe("443661"); // Olise (last Palace season) → photo code
    expect(at(p2025, 1001854)?.photo).toContain("img.a.transfermarkt.technology"); // Drakes-Thomas → portrait URL
    expect(at(load(2014), 1003042)?.photo).toBe("12002"); // Stewart Downing → photo code
  });
});
