import "server-only";

import { getAvailableSeasons } from "@/data/loaders";

import { HeaderSeasonSwitcher } from "./HeaderSeasonSwitcher";

// Server wrapper (TASK-702) that resolves the committed-season list from
// `data/_meta.json` and hands it to the client `<HeaderSeasonSwitcher>`.
// Rendered inside the Header's `<Suspense>` boundary, so the tiny meta read
// streams and the client component still owns the `?season=` URL binding.
//
// <HeaderSeasonSwitcher> hides itself on entity detail routes (TASK-M10), where
// the page renders its own season control scoped to the entity's seasons.
export async function SeasonSwitcherLoader() {
  const seasons = await getAvailableSeasons();
  return <HeaderSeasonSwitcher seasons={seasons} />;
}
