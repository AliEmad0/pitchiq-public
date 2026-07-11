import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/data/loaders", () => ({
  loadClubLogos: vi.fn(async () => null),
  loadManagers: vi.fn(),
  loadManagerBios: vi.fn(),
  loadTeams: vi.fn(),
}));

import { loadManagers, loadManagerBios, loadTeams } from "../../src/data/loaders";
import { getSeasonManagers } from "../../src/features/managers/managers-index.api";

const mock = (fn: unknown) => fn as ReturnType<typeof vi.fn>;

describe("getSeasonManagers", () => {
  beforeEach(() => vi.clearAllMocks());

  it("joins bio + team and sorts by points", async () => {
    mock(loadManagers).mockResolvedValue({
      "2009": {
        "33": [
          {
            id: "58",
            name: "Alex Ferguson",
            matches: 38,
            win: 27,
            draw: 4,
            loss: 7,
            gf: 86,
            ga: 28,
          },
        ],
        "34": [
          {
            id: "166",
            name: "Joe Kinnear",
            matches: 38,
            win: 7,
            draw: 13,
            loss: 18,
            gf: 40,
            ga: 59,
          },
        ],
      },
    });
    mock(loadManagerBios).mockResolvedValue({
      "58": { birthDate: "1941-12-31", dateOfDeath: null, nationalityCode: "gb" },
    });
    mock(loadTeams).mockResolvedValue([
      { id: 33, name: "Manchester United", logo: "/logos/33.png" },
      { id: 34, name: "Newcastle", logo: "/logos/34.png" },
    ]);

    const rows = await getSeasonManagers(2009);
    expect(rows).not.toBeNull();
    expect(rows!.map((r) => r.managerId)).toEqual(["58", "166"]);
    expect(rows![0]).toMatchObject({
      teamName: "Manchester United",
      teamLogo: "/logos/33.png",
      nationalityCode: "gb",
      nationality: "United Kingdom",
      photo: "58",
    });
    expect(rows![0].record.points).toBe(85);
  });

  it("uses an override photo when present", async () => {
    mock(loadManagers).mockResolvedValue({
      "2009": {
        "33": [
          { id: "58", name: "Alex Ferguson", matches: 1, win: 1, draw: 0, loss: 0, gf: 1, ga: 0 },
        ],
      },
    });
    mock(loadManagerBios).mockResolvedValue({
      "58": { birthDate: null, dateOfDeath: null, photo: "https://x/af.jpg" },
    });
    mock(loadTeams).mockResolvedValue([{ id: 33, name: "Man Utd", logo: "/logos/33.png" }]);
    const rows = await getSeasonManagers(2009);
    expect(rows![0].photo).toBe("https://x/af.jpg");
  });

  it("returns null when the season has no manager data", async () => {
    mock(loadManagers).mockResolvedValue({ "2009": {} });
    mock(loadManagerBios).mockResolvedValue({});
    mock(loadTeams).mockResolvedValue([]);
    expect(await getSeasonManagers(1999)).toBeNull();
  });
});
