import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/utils/cn";

type Props = {
  count?: number;
  /** Number of skeleton rows inside each card. Defaults to 5 to match the
   * top-5 leaderboard cap from TASK-205. */
  rows?: number;
  className?: string;
};

// Placeholder for `<StatLeaderboard>` cards (TASK-205): a fixed-height card
// with a title row and the top-N entries. The skeleton wraps the real Card /
// CardHeader / CardContent primitives so it inherits the same padding, gap,
// and border-radius — guaranteeing the swap to the real card doesn't shift
// adjacent grid items.
export function StatCardSkeleton({ count = 1, rows = 5, className }: Props) {
  return (
    <>
      {Array.from({ length: count }, (_, cardIdx) => (
        <Card key={cardIdx} className={cn(className)} role="status" aria-label="Loading">
          <CardHeader>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-20" />
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {Array.from({ length: rows }, (_, rowIdx) => (
              <div key={rowIdx} className="flex items-center gap-3">
                <Skeleton className="h-3 w-3 shrink-0" />
                <Skeleton className="size-8 shrink-0 rounded-full" />
                <div className="flex flex-1 flex-col gap-1.5">
                  <Skeleton className="h-3.5 w-32 max-w-full" />
                  <Skeleton className="h-2.5 w-20 max-w-full" />
                </div>
                <Skeleton className="h-5 w-8 shrink-0" />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </>
  );
}
