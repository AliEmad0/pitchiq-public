import { describe, expect, it } from "vitest";

import {
  canPlay,
  PlayerRoleSchema,
  PlayerSchema,
  RoleSourceSchema,
  type PlayerRole,
} from "@/data/schemas";

const OUTFIELD: PlayerRole[] = [
  "RB",
  "CB",
  "LB",
  "CDM",
  "CM",
  "CAM",
  "RM",
  "LM",
  "RW",
  "LW",
  "SS",
  "CF",
];

describe("PlayerRoleSchema", () => {
  it("accepts every canonical role code", () => {
    for (const r of ["GK", ...OUTFIELD]) {
      expect(PlayerRoleSchema.parse(r)).toBe(r);
    }
  });

  it("rejects an unknown role code", () => {
    expect(PlayerRoleSchema.safeParse("STRIKER").success).toBe(false);
  });
});

describe("RoleSourceSchema", () => {
  it("accepts the three provenance tiers", () => {
    for (const s of ["enriched", "grid", "coarse"]) {
      expect(RoleSourceSchema.parse(s)).toBe(s);
    }
  });
});

describe("canPlay — the only eligibility rule (hard ban, no penalty tier)", () => {
  it("allows the primary role", () => {
    expect(canPlay({ role: "CF", altRoles: [] }, "CF")).toBe(true);
  });

  it("allows every alternate role", () => {
    const henry = { role: "CF" as PlayerRole, altRoles: ["LW", "SS"] as PlayerRole[] };
    expect(canPlay(henry, "LW")).toBe(true);
    expect(canPlay(henry, "SS")).toBe(true);
  });

  it("rejects any role that is neither primary nor an alternate", () => {
    expect(canPlay({ role: "CF", altRoles: ["LW", "SS"] }, "CB")).toBe(false);
    expect(canPlay({ role: "CB", altRoles: [] }, "CF")).toBe(false);
  });

  it("rejects a goalkeeper from every outfield slot", () => {
    for (const slot of OUTFIELD) {
      expect(canPlay({ role: "GK", altRoles: [] }, slot)).toBe(false);
    }
  });

  it("rejects an outfielder from the goalkeeper slot", () => {
    expect(canPlay({ role: "CB", altRoles: ["RB", "LB"] }, "GK")).toBe(false);
  });

  it("treats a null role as ineligible everywhere (unenriched player)", () => {
    for (const slot of ["GK", ...OUTFIELD] as PlayerRole[]) {
      expect(canPlay({ role: null, altRoles: [] }, slot)).toBe(false);
    }
  });
});

describe("PlayerSchema — additive role fields", () => {
  const metrics = {
    appearances: null,
    goals: null,
    assists: null,
    passAccuracy: null,
    keyPasses: null,
    tackles: null,
    interceptions: null,
    duelsWon: null,
    dribblesCompleted: null,
    shotsOnTarget: null,
    yellowCards: null,
    redCards: null,
  };
  const base = {
    id: 1000208,
    name: "Bruno Fernandes",
    teamId: 33,
    teamName: "Manchester United",
    position: "Midfielder" as const,
    photo: null,
    metrics,
  };

  it("still validates a row with no role fields (existing committed data)", () => {
    const p = PlayerSchema.parse(base);
    // Additive/optional — a pre-enrichment row simply omits the role fields.
    expect(p.altRoles).toBeUndefined();
    expect(p.role ?? null).toBeNull();
  });

  it("accepts the enriched role fields", () => {
    const p = PlayerSchema.parse({
      ...base,
      role: "CAM",
      altRoles: ["CM", "SS"],
      foot: "right",
      roleSource: "enriched",
      height: 179,
    });
    expect(p.role).toBe("CAM");
    expect(p.altRoles).toEqual(["CM", "SS"]);
    expect(p.foot).toBe("right");
    expect(p.roleSource).toBe("enriched");
    expect(p.height).toBe(179);
  });

  it("rejects a non-canonical role code on a player row", () => {
    expect(PlayerSchema.safeParse({ ...base, role: "MIDFIELD" }).success).toBe(false);
  });
});
