// Test stub for `@/i18n/navigation` (aliased in vitest.config.ts). The real
// module builds on next-intl's `createNavigation`, which does a bare
// `import "next/navigation"` (no extension) that vitest's ESM resolver rejects
// — so importing the real module crashes any test that renders a component
// using the locale-aware `Link`/`usePathname` (TASK-1603 link sweep).
//
// In tests we don't need locale-prefixing: `Link` delegates to `next/link`
// (so `href` assertions are unchanged — the default `en` locale is un-prefixed
// anyway), and the hooks re-export from `next/navigation` so a test's own
// `vi.mock("next/navigation")` still takes effect.
export { default as Link } from "next/link";
export { usePathname, useRouter, redirect } from "next/navigation";

export function getPathname({ href }: { href: string }): string {
  return href;
}
