// TASK-1601 — root passthrough layout. With i18n routing the real root layout
// (the one that renders <html>/<body>, providers, fonts, era chrome) lives at
// `app/[locale]/layout.tsx`. Next still requires a root `app/layout.tsx`; per
// next-intl's App Router guidance it just forwards children so the framework
// can render the root `app/not-found.tsx` (for non-localized requests) without
// a second <html>.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
