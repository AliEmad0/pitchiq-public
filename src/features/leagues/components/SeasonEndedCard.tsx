import { Link } from "@/i18n/navigation";
import { Trophy } from "lucide-react";

import { formatSeasonLabel } from "@/utils/season";

// TASK-608 — replaces the always-empty <FixturesRail mode="next"> when the
// dashboard's selected season has ended (every fixture in the past). Native
// anchor link to `#standings` jumps the user to the standings section on the
// same page; no JS / no client boundary needed.
//
// `role="status"` + `aria-label` so screen readers announce the empty-state
// in place of the missing rail (matching the existing EmptyState component
// pattern on the same page).
type Props = {
  season: number;
};

export function SeasonEndedCard({ season }: Props) {
  const label = formatSeasonLabel(season);

  return (
    <div
      className="rounded-md border bg-card p-6 text-sm"
      role="status"
      aria-label={`Season ${label} ended`}
    >
      <div className="flex items-start gap-3">
        <Trophy className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden />
        <div>
          <p className="font-medium text-foreground">The {label} season has ended.</p>
          <p className="mt-1 text-muted-foreground">
            <Link
              href="#standings"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              View the final standings
            </Link>{" "}
            for the full table.
          </p>
        </div>
      </div>
    </div>
  );
}
