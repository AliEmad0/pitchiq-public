import type { MetadataRoute } from "next";

import { loadFixtures, loadPlayers, loadTeams } from "@/data/loaders";
import { currentDataSeason } from "@/utils/season";
import { getSiteUrl } from "@/utils/site-url";

// Next 15 file-convention sitemap. Enumerates the current data season in full
// (~20 teams + ~518 players + ~380 fixtures + static routes ≈ ~920 URLs, well
// under the 10k threshold). Historical seasons are excluded to keep the sitemap
// from ballooning to ~30k URLs; the current season is the indexing priority.
//
// TASK-1601: each entry advertises its Arabic alternate via hreflang. The
// canonical `url` stays the un-prefixed English URL (localePrefix "as-needed");
// Arabic lives under /ar. Row count is unchanged — each row just gains the
// `alternates.languages` field.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl().toString().replace(/\/$/, "");
  const season = currentDataSeason();

  // `path` is the un-prefixed pathname (with optional query), e.g. "/teams/42".
  const langs = (path: string) => ({
    languages: { en: `${base}${path}`, ar: `${base}/ar${path}` },
  });

  const [teams, players, fixtures] = await Promise.all([
    loadTeams(season),
    loadPlayers(season),
    loadFixtures(season),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, alternates: langs("/"), changeFrequency: "daily", priority: 1 },
    { url: `${base}/teams`, alternates: langs("/teams"), changeFrequency: "weekly", priority: 0.8 },
    // TASK-M12: the all-fixtures listing for the current season (kept lean —
    // just the current season, not one per committed season). Listed bare: the
    // page defaults to `currentDataSeason()`, so `/fixtures` and
    // `/fixtures?season=<current>` are the same page and the bare form is the
    // canonical one (a sitemap must list canonical URLs).
    {
      url: `${base}/fixtures`,
      alternates: langs("/fixtures"),
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${base}/compare`,
      alternates: langs("/compare"),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    { url: `${base}/map`, alternates: langs("/map"), changeFrequency: "monthly", priority: 0.6 },
  ];

  const teamRoutes: MetadataRoute.Sitemap = (teams ?? []).map((t) => ({
    url: `${base}/teams/${t.id}`,
    alternates: langs(`/teams/${t.id}`),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const playerRoutes: MetadataRoute.Sitemap = (players ?? []).map((p) => ({
    url: `${base}/players/${p.id}`,
    alternates: langs(`/players/${p.id}`),
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const fixtureRoutes: MetadataRoute.Sitemap = (fixtures ?? []).map((f) => ({
    url: `${base}/fixtures/${f.id}`,
    alternates: langs(`/fixtures/${f.id}`),
    changeFrequency: "monthly",
    priority: 0.4,
  }));

  return [...staticRoutes, ...teamRoutes, ...playerRoutes, ...fixtureRoutes];
}
