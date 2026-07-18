import { afterEach, describe, expect, it, vi } from "vitest";

// getEntityNames() (used to localize the per-player club label on /ar) reads the
// ar-name maps from @/data/loaders, so they must be mocked alongside the index.
vi.mock("@/data/loaders", () => ({
  loadSearchIndex: vi.fn(),
  loadArTeamNames: vi.fn(async () => ({ "40": "ليفربول" })),
  loadArPlayerNames: vi.fn(async () => ({})),
  loadArManagerNames: vi.fn(async () => ({})),
  loadArVenueNames: vi.fn(async () => ({})),
  loadArCityNames: vi.fn(async () => ({})),
  loadArRefereeNames: vi.fn(async () => ({})),
  loadArPositionNames: vi.fn(async () => ({})),
  loadArNationalityOverrides: vi.fn(async () => ({})),
}));

import { GET } from "@/app/api/search/route";
import { loadSearchIndex } from "@/data/loaders";

const req = (q: string) => new Request(`http://localhost/api/search?q=${encodeURIComponent(q)}`);

const INDEX = {
  players: [
    // historical-only player — last appeared 2011-12
    {
      id: 900,
      name: "Thierry Henry",
      teamId: 42,
      teamName: "Arsenal",
      photo: null,
      latestSeason: 2011,
      ga: 250,
      apps: 258,
    },
    {
      id: 1,
      name: "Bukayo Saka",
      teamId: 42,
      teamName: "Arsenal",
      photo: "123",
      latestSeason: 2025,
      ga: 80,
      apps: 200,
    },
    // For ranking: "van" matches a WORD-start in "van Persie" (tier 0) and as an
    // incidental substring in "Cavani" (tier 1). Cavani has higher ga than van
    // Persie here, to prove tier beats raw prominence.
    {
      id: 10,
      name: "Robin van Persie",
      teamId: 33,
      teamName: "Manchester United",
      photo: null,
      latestSeason: 2014,
      ga: 197,
      apps: 280,
    },
    {
      id: 11,
      name: "Edinson Cavani",
      teamId: 33,
      teamName: "Manchester United",
      photo: null,
      latestSeason: 2021,
      ga: 220,
      apps: 300,
    },
  ],
  teams: [
    { id: 42, name: "Arsenal", latestSeason: 2025 },
    { id: 1333, name: "Wimbledon", latestSeason: 1999 }, // defunct club
  ],
  managers: [
    // modern manager (numeric id) with a bio photo
    { id: "58", name: "Alex Ferguson", photo: "https://cdn/ferg.png", latestSeason: 2012 },
    // legacy-only manager (lm- slug id), no photo
    { id: "lm-ossie-ardiles", name: "Ossie Ardiles", photo: null, latestSeason: 1994 },
  ],
};

afterEach(() => vi.clearAllMocks());

describe("GET /api/search (cross-season index, TASK-M08)", () => {
  it("400s when q is shorter than 2 chars", async () => {
    const res = await GET(req("a"));
    expect(res.status).toBe(400);
  });

  it("finds a historical-only player and carries its latest season on the result", async () => {
    vi.mocked(loadSearchIndex).mockResolvedValue(INDEX as never);
    const res = await GET(req("henry"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.players).toHaveLength(1);
    expect(body.players[0]).toMatchObject({
      id: 900,
      name: "Thierry Henry",
      season: 2011, // ← drives the ?season= link so the profile resolves
      team: { id: 42, name: "Arsenal", logo: "/logos/42.png" },
    });
    expect(body.players[0].photo).toBe(""); // null → "" so PlayerImage falls back to initials
  });

  it("ranks word-start matches above incidental substrings, then by prominence (TASK-M29)", async () => {
    vi.mocked(loadSearchIndex).mockResolvedValue(INDEX as never);
    const body = await (await GET(req("van"))).json();
    const names = body.players.map((p: { name: string }) => p.name);
    // "van Persie" (word-start "van") must rank ABOVE "Cavani" (substring only),
    // even though Cavani has higher ga — tier wins over raw prominence.
    expect(names).toEqual(["Robin van Persie", "Edinson Cavani"]);
  });

  it("matches an auto-derived acronym at top tier — rvp → Robin van Persie (TASK-M30)", async () => {
    vi.mocked(loadSearchIndex).mockResolvedValue(INDEX as never);
    const body = await (await GET(req("rvp"))).json();
    // "rvp" is in no name as a substring; it equals van Persie's name acronym.
    expect(body.players[0].name).toBe("Robin van Persie");
  });

  it("matches a curated alias even when the name lacks the query — cr7 → Ronaldo (TASK-M30)", async () => {
    const idx = {
      players: [
        {
          id: 7,
          name: "Cristiano Ronaldo",
          teamId: 33,
          teamName: "Manchester United",
          photo: null,
          latestSeason: 2021,
          ga: 150,
          apps: 200,
          aliases: ["cr7"],
        },
      ],
      teams: [],
    };
    vi.mocked(loadSearchIndex).mockResolvedValue(idx as never);
    const body = await (await GET(req("cr7"))).json();
    expect(body.players).toHaveLength(1);
    expect(body.players[0]).toMatchObject({ id: 7, name: "Cristiano Ronaldo", season: 2021 });
  });

  it("finds a defunct club and carries its latest season", async () => {
    vi.mocked(loadSearchIndex).mockResolvedValue(INDEX as never);
    const res = await GET(req("wimbledon"));
    const body = await res.json();
    expect(body.teams).toEqual([
      { id: 1333, name: "Wimbledon", logo: "/logos/1333.png", season: 1999 },
    ]);
  });

  it("still returns current-season entities (no regression)", async () => {
    vi.mocked(loadSearchIndex).mockResolvedValue(INDEX as never);
    const teamRes = await (await GET(req("ars"))).json();
    expect(teamRes.teams.some((t: { name: string }) => t.name === "Arsenal")).toBe(true);

    const playerRes = await (await GET(req("saka"))).json();
    const saka = playerRes.players.find((p: { name: string }) => p.name === "Bukayo Saka");
    expect(saka).toMatchObject({ id: 1, season: 2025 });
  });

  it("502s when the index is unavailable", async () => {
    vi.mocked(loadSearchIndex).mockResolvedValue(null as never);
    const res = await GET(req("xyz"));
    expect(res.status).toBe(502);
  });

  it("finds a manager and carries its latest season + photo on the result", async () => {
    vi.mocked(loadSearchIndex).mockResolvedValue(INDEX as never);
    const body = await (await GET(req("ferguson"))).json();
    expect(body.managers).toEqual([
      { id: "58", name: "Alex Ferguson", photo: "https://cdn/ferg.png", season: 2012 },
    ]);
  });

  it("returns a legacy-only manager with its lm- id and photo coerced to ''", async () => {
    vi.mocked(loadSearchIndex).mockResolvedValue(INDEX as never);
    const body = await (await GET(req("ardiles"))).json();
    expect(body.managers).toEqual([
      { id: "lm-ossie-ardiles", name: "Ossie Ardiles", photo: "", season: 1994 },
    ]);
  });

  it("tolerates an older index with no managers field (back-compat)", async () => {
    vi.mocked(loadSearchIndex).mockResolvedValue({ players: [], teams: [] } as never);
    const body = await (await GET(req("ferguson"))).json();
    expect(body.managers).toEqual([]);
  });
});

describe("Arabic queries + display (TASK-1606)", () => {
  const reqLoc = (q: string, locale: string) =>
    new Request(`http://localhost/api/search?q=${encodeURIComponent(q)}&locale=${locale}`);
  const AR_INDEX = {
    players: [
      {
        id: 900,
        name: "Mohamed Salah",
        nameAr: "محمد صلاح",
        teamId: 40,
        teamName: "Liverpool",
        photo: null,
        latestSeason: 2025,
        ga: 250,
        apps: 258,
      },
    ],
    teams: [{ id: 42, name: "Arsenal", nameAr: "أرسنال", latestSeason: 2025 }],
    managers: [] as unknown[],
  };

  it("matches an Arabic team query and returns the Arabic name on /ar", async () => {
    vi.mocked(loadSearchIndex).mockResolvedValue(AR_INDEX as never);
    const body = await (await GET(reqLoc("أرسنال", "ar"))).json();
    expect(body.teams).toHaveLength(1);
    expect(body.teams[0].name).toBe("أرسنال");
  });

  it("matches an Arabic player query on /ar", async () => {
    vi.mocked(loadSearchIndex).mockResolvedValue(AR_INDEX as never);
    const body = await (await GET(reqLoc("صلاح", "ar"))).json();
    expect(body.players[0].name).toBe("محمد صلاح");
    // TASK-M65 follow-up: the per-player club label is localized by team id on /ar.
    expect(body.players[0].team.name).toBe("ليفربول");
  });

  it("still returns the Latin name (and matches Latin queries) on /en", async () => {
    vi.mocked(loadSearchIndex).mockResolvedValue(AR_INDEX as never);
    const body = await (await GET(reqLoc("arsenal", "en"))).json();
    expect(body.teams[0].name).toBe("Arsenal");
  });
});
