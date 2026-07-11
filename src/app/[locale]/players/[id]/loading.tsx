import { useTranslations } from "next-intl";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Route-scoped loading boundary for `/players/[id]`. Shown on navigation
// until the page's `getPlayerProfile` await resolves. Mirrors the hero +
// 12-card stats footprint so the swap-in doesn't reflow.
export default function PlayerProfileLoading() {
  const t = useTranslations("players");
  return (
    <main
      className="container-page space-y-6 py-6 lg:py-10"
      role="status"
      aria-live="polite"
      aria-label={t("loadingProfile")}
    >
      <Card className="p-4 lg:p-8">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
          <Skeleton className="size-32 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-40" />
          </div>
          <Skeleton className="h-9 w-48 shrink-0" />
        </div>
      </Card>
      <div className="space-y-3">
        <Skeleton className="h-6 w-44" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 12 }, (_, i) => (
            <Skeleton key={i} className="h-[4.75rem] w-full rounded-md" />
          ))}
        </div>
      </div>
    </main>
  );
}
