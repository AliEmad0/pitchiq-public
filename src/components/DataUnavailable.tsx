import { Link } from "@/i18n/navigation";
import { CalendarX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/utils/cn";

/**
 * Generic per-feature empty-state card (TASK-703).
 *
 * Shown when a feature has no data for the selected season — e.g. a player's
 * stats, a team's squad, or a comparison for a season that pre-dates the
 * dataset's coverage. Centralises the tone + layout so Phase 8's ancient-history
 * range (standings + fixtures only) reuses one component instead of a parallel
 * design pass. Mirrors the `<LineupUnavailable>` / `<EventsUnavailable>` pattern
 * from TASK-508.
 */
export function DataUnavailable({
  title = "Data unavailable",
  message,
  cta,
  className,
}: {
  title?: string;
  message: string;
  /** Optional call-to-action link, e.g. "View standings instead" → "/". */
  cta?: { href: string; label: string };
  className?: string;
}) {
  return (
    <Card
      role="status"
      aria-label={title}
      className={cn("flex flex-col items-center gap-3 p-8 text-center", className)}
    >
      <CalendarX className="text-muted-foreground size-10" aria-hidden />
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="text-muted-foreground max-w-md text-sm">{message}</p>
      {cta && (
        <Button asChild variant="outline" size="sm">
          <Link href={cta.href}>{cta.label}</Link>
        </Button>
      )}
    </Card>
  );
}
