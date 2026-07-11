"use client";

import dynamic from "next/dynamic";

import { Skeleton } from "@/components/ui/skeleton";

import type { ComparisonRadarProps } from "./ComparisonRadar";

// Lazy boundary for the recharts-backed radar (TASK-906). recharts is ~90 kB;
// loading it on demand (client-only) keeps it out of the /compare first-load JS.
// `ssr: false` is permitted here because this wrapper is a Client Component
// (Next 15 disallows ssr:false dynamic imports inside Server Components, and
// compare/page.tsx is a Server Component). The skeleton matches the radar's
// container height (h-72 sm:h-80) to avoid layout shift while the chunk loads.
const ComparisonRadar = dynamic(() => import("./ComparisonRadar").then((m) => m.ComparisonRadar), {
  ssr: false,
  loading: () => <Skeleton className="h-72 w-full sm:h-80" />,
});

export function ComparisonRadarLazy(props: ComparisonRadarProps) {
  return <ComparisonRadar {...props} />;
}
