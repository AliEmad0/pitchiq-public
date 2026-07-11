import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/utils/cn";

type Props = {
  count?: number;
  className?: string;
};

// Placeholder for tabular feeds: standings (TASK-204), fixtures
// (TASK-202/203), and Phase-3 head-to-head lists. The bounding box is sized
// against the Shadcn `Table` defaults — `h-12` row, comfortable horizontal
// gaps — so the swap from skeleton to real `<tr>` doesn't shift layout.
//
// Cell composition (rank | crest | name | numeric…) mirrors the eventual
// standings shape, which is the most-used variant. Feature-specific tables
// that diverge meaningfully (e.g. fixtures with a result badge) can compose
// a sibling skeleton — this one stays opinionated rather than configurable.
export function TableRowSkeleton({ count = 1, className }: Props) {
  return (
    <div className={cn("flex w-full flex-col", className)} role="status" aria-label="Loading">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex h-12 items-center gap-3 border-b px-3 last:border-b-0">
          <Skeleton className="h-4 w-4 shrink-0" />
          <Skeleton className="size-6 shrink-0 rounded-full" />
          <Skeleton className="h-4 flex-1 max-w-[200px]" />
          <Skeleton className="hidden h-4 w-6 sm:block" />
          <Skeleton className="hidden h-4 w-6 sm:block" />
          <Skeleton className="hidden h-4 w-6 sm:block" />
          <Skeleton className="hidden h-4 w-6 sm:block" />
          <Skeleton className="h-4 w-8" />
        </div>
      ))}
    </div>
  );
}
