// Manual cache-bust endpoint. Used during dev/staging to force-refresh
// a tagged fetch entry without waiting for its `revalidate` window to
// expire. Production callers should set `REVALIDATE_SECRET` to a random
// secret (`openssl rand -hex 32`) and store it in Vercel env vars.
//
// The secret is in the query string for ease of `curl` invocation; this
// route is admin-only and shouldn't be linked from any public surface.

import { revalidateTag } from "next/cache";

import { logger } from "@/utils/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tag = url.searchParams.get("tag");
  const secret = url.searchParams.get("secret");

  const expected = process.env.REVALIDATE_SECRET;

  // Reject when the secret is unset on the server too — empty env must
  // never act as a bypass.
  if (!expected || !secret || secret !== expected) {
    logger.warn("admin.revalidate.unauthorized", { hasTag: Boolean(tag) });
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  if (!tag) {
    return Response.json({ ok: false, error: "missing tag" }, { status: 400 });
  }

  revalidateTag(tag);
  logger.info("admin.revalidate.ok", { tag });
  return Response.json({ ok: true, tag });
}
