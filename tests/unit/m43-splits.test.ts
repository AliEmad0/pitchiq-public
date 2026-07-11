import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import type { Player } from "@/data/schemas";

// TASK-M43 — three 2025-26 same-person SPLITS merged to their historical id, plus
// the Savinho rename, against the committed data.
const load = (season: number): Player[] =>
  JSON.parse(readFileSync(join(process.cwd(), "data", `players-${season}.json`), "utf8"));

describe("TASK-M43 2025-26 split merges", () => {
  const p2025 = load(2025);
  const byId = (id: number) => p2025.find((p) => p.id === id);
  const ids = new Set(p2025.map((p) => p.id));

  it.each([
    [1000241, 1001827, "Casemiro", "Carlos Henrique Casimiro"],
    [1000955, 1005565, "Lucas Paquetá", "Lucas Tolentino Coelho de Lima"],
    [1000185, 1001793, "Beto", "Norberto Bercique Gomes Betuncal"],
  ])(
    "merges %s; old id %s is gone; name is %s not the FPL legal name",
    (newId, oldId, short, full) => {
      expect(byId(newId)?.name).toBe(short);
      expect(ids.has(oldId)).toBe(false);
      expect(p2025.some((p) => p.name === full)).toBe(false);
    },
  );

  it("renames 1001394 to Savinho (the PL display name)", () => {
    expect(byId(1001394)?.name).toBe("Savinho");
  });

  it("connects each merged player's history under one id across 2024 + 2025", () => {
    const p2024 = load(2024);
    for (const [id, name] of [
      [1000241, "Casemiro"],
      [1000955, "Lucas Paquetá"],
      [1000185, "Beto"],
      [1001394, "Savinho"],
    ] as const) {
      expect(p2024.find((p) => p.id === id)?.name).toBe(name); // same id + name in 2024-25
      expect(byId(id)?.name).toBe(name); //                       and 2025-26
    }
  });
});
