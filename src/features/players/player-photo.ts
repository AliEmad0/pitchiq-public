// Pure player-photo helpers — NO "use client". Kept separate from the client
// `<PlayerImage>` so Server Components (e.g. `<PlayerHero>`) can resolve a photo
// URL: a function exported from a "use client" module becomes an uncallable
// client reference when imported into a Server Component. `<PlayerImage>`
// re-exports these for its existing consumers/tests.

// Current PL photo CDN (post-redesign): no `p` prefix, 110x140, `premierleague25`.
const FPL_PHOTO_BASE = "https://resources.premierleague.com/premierleague25/photos/players/110x140";
// Legacy CDN, kept as a fallback for the codes still served only there.
const FPL_PHOTO_BASE_LEGACY =
  "https://resources.premierleague.com/premierleague/photos/players/250x250";

/**
 * Ordered list of candidate `<img>` srcs for a `photo` field — the component
 * tries them in turn, falling back to initials when all fail. An absolute URL
 * has one candidate; an FPL code has two (current CDN path, then the legacy
 * one); anything else (`""`, `null`, non-numeric) has none.
 */
export function playerPhotoCandidates(photo: string | null | undefined): string[] {
  if (!photo) return [];
  if (/^https?:\/\//i.test(photo)) return [photo];
  if (/^\d+$/.test(photo))
    return [`${FPL_PHOTO_BASE}/${photo}.png`, `${FPL_PHOTO_BASE_LEGACY}/p${photo}.png`];
  return [];
}

/**
 * Map a `photo` field to its primary `<img>` src, or `null` when there's no
 * usable image (caller renders initials).
 */
export function resolvePlayerPhotoSrc(photo: string | null | undefined): string | null {
  return playerPhotoCandidates(photo)[0] ?? null;
}

/**
 * 1-2 letter monogram: first + last word initial (`"Bukayo Saka"` → `"BS"`),
 * single word → its first letter, empty → `"?"`.
 */
export function playerInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase();
  return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase();
}
