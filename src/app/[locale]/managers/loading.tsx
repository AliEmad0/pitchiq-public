import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="container-page space-y-6 py-6 lg:py-10">
      <Skeleton className="h-9 w-72" />
      <Skeleton className="h-10 w-full max-w-sm" />
      <Skeleton className="h-96 w-full" />
    </main>
  );
}
