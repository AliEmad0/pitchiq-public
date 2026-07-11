import "server-only";

import { getEntityNames } from "@/features/i18n/entity-names";
import { loadClubLogos, loadManagers, loadManagerBios, loadTeams } from "@/data/loaders";
import { clubLogoFromMap } from "@/utils/club-logo";
import { countryNameFromCode } from "@/utils/country";

import { seasonManagerRows, type ManagerRecord } from "./manager-stats";

/**
 * One index row per (manager, club) for a season — the manager joined to bio
 * (photo/nationality) + the club crest. `photo` is the manager's PL id (resolved
 * to the PL-CDN headshot by `<PlayerImage>`) unless a bio override supplies one.
 * Returns null when the season has no manager data (legacy 1992-2007).
 */
export type ManagerIndexRow = {
  managerId: string;
  name: string;
  photo: string;
  nationality: string | null;
  nationalityCode: string | null;
  teamId: number;
  teamName: string;
  teamLogo: string;
  record: ManagerRecord;
};

export async function getSeasonManagers(season: number): Promise<ManagerIndexRow[] | null> {
  const managers = await loadManagers();
  const byTeam = managers?.[String(season)];
  if (!managers || !byTeam || Object.keys(byTeam).length === 0) return null;

  const [bios, teams, clubLogos, names] = await Promise.all([
    loadManagerBios(),
    loadTeams(season),
    loadClubLogos(),
    getEntityNames(),
  ]);
  const teamById = new Map((teams ?? []).map((t) => [t.id, t]));

  return seasonManagerRows(managers, season).map((r) => {
    const bio = bios?.[r.managerId];
    const team = teamById.get(r.teamId);
    const nationalityCode = bio?.nationalityCode ?? null;
    return {
      managerId: r.managerId,
      name: names.manager(r.managerId, r.name),
      photo: bio?.photo ?? r.managerId,
      nationality: names.nationality(
        nationalityCode,
        bio?.nationality ?? countryNameFromCode(nationalityCode),
      ),
      nationalityCode,
      teamId: r.teamId,
      teamName: names.team(r.teamId, team?.name ?? ""),
      teamLogo: clubLogoFromMap(r.teamId, season, clubLogos),
      record: r.record,
    };
  });
}
