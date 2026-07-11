// Canonical absolute origin for the deployed site. Used by `metadataBase`
// in `src/app/layout.tsx` so OG/Twitter image URLs resolve outside dev.
//
// Precedence (highest → lowest):
//   1. NEXT_PUBLIC_SITE_URL — explicit production canonical
//   2. https://${VERCEL_URL} — Vercel auto-injects on every deploy/preview
//   3. http://localhost:3000 — dev fallback; social validators never see this
//
// Returns a `URL` because that's the shape Next 15's Metadata API expects
// for `metadataBase`. Throws TypeError on a malformed NEXT_PUBLIC_SITE_URL
// (documented in tests) so misconfiguration surfaces immediately.
export function getSiteUrl(): URL {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return new URL(explicit);

  const vercel = process.env.VERCEL_URL;
  if (vercel) return new URL(`https://${vercel}`);

  return new URL("http://localhost:3000");
}
