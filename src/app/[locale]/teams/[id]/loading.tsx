import { useTranslations } from "next-intl";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RecentFormStripSkeleton } from "@/features/teams/components/RecentFormStrip";
import { SquadGridSkeleton } from "@/features/teams/components/SquadGrid";
import { TeamStatsTilesSkeleton } from "@/features/teams/components/TeamStatsTiles";

// Route-scoped loading boundary for `/teams/[id]`. Next renders this on
// initial navigation until the page's top-level await (getTeam +
// getStandings) resolves and the hero can stream. The secondary sections
// (stats / form / squad) each have their own per-section Suspense
// skeletons in the page itself; this file covers the gap between
// "navigation started" and "hero ready", and reuses those same section
// skeletons below the hero placeholder so the loading footprint matches
// the eventual page layout (no CLS on the swap-in).
export default function TeamProfileLoading() {
  const t = useTranslations("teams");
  return (
    <main
      className="container-page space-y-6 py-6 lg:py-10"
      role="status"
      aria-live="polite"
      aria-label={t("loadingProfile")}
    >
      <TeamHeroSkeleton />
      <TeamStatsTilesSkeleton />
      <RecentFormStripSkeleton />
      <SquadGridSkeleton />
    </main>
  );
}

// Inline because only the loading boundary uses it; it intentionally
// mirrors the real `<TeamHero>` footprint (200px logo column + name +
// metadata dl + venue image placeholder) so the post-fetch swap doesn't
// reflow the row.
function TeamHeroSkeleton() {
  return (
    <Card className="p-4 lg:p-8">
      <div className="grid gap-6 md:grid-cols-[200px_1fr]">
        <div className="flex items-start justify-center md:justify-start">
          <Skeleton className="size-32 md:size-40" />
        </div>
        <div className="space-y-3">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-5 w-12" />
          </div>
          <Skeleton className="h-6 w-32" />
          <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 sm:max-w-md">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i}>
                <Skeleton className="h-3 w-16" />
                <Skeleton className="mt-1 h-4 w-24" />
              </div>
            ))}
          </dl>
          <Skeleton className="aspect-video w-full max-w-md" />
        </div>
      </div>
    </Card>
  );
}
