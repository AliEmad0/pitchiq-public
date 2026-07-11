import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/utils/cn";

type Props = {
  count?: number;
  className?: string;
};

// Placeholder for the comparison-engine player chip (Phase 4) and any other
// avatar + label list rows (e.g. squad lists, head-to-head pickers).
// Footprint matches a rounded-full chip with `size-10` avatar and a
// two-line name/team text block, so it can slot directly into the eventual
// `<PlayerChip />` slot without shifting siblings.
export function PlayerChipSkeleton({ count = 1, className }: Props) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)} role="status" aria-label="Loading">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-full border bg-card px-3 py-1.5">
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-2.5 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}
