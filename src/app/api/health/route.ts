import "server-only";

import { NextResponse } from "next/server";

import { loadMeta } from "@/data/loaders";

// TASK-510 health endpoint. Reports app build identity + uptime + the
// current data freshness signal. `data` mirrors `_meta.json`'s
// `lastRefresh` + `datasets[]` directly — an uptime monitor wanting to
// alert on stale data checks `data.lastRefresh` against now. `null` when
// `data/_meta.json` is missing / malformed; the app itself is still up.
//
// Always dynamic — uptime + ts must reflect each request rather than
// being baked into a prerender.
export const dynamic = "force-dynamic";

type DataState = {
  lastRefresh: string;
  datasets: Array<{ slug: string; downloadedAt: string }>;
} | null;

type HealthResponse = {
  status: "ok";
  commit: string;
  uptime: number;
  data: DataState;
  ts: string;
};

export async function GET() {
  const meta = await loadMeta();
  const data: DataState = meta ? { lastRefresh: meta.lastRefresh, datasets: meta.datasets } : null;

  const body: HealthResponse = {
    status: "ok",
    commit: process.env.VERCEL_GIT_COMMIT_SHA ?? "dev",
    uptime: process.uptime(),
    data,
    ts: new Date().toISOString(),
  };
  return NextResponse.json(body);
}
