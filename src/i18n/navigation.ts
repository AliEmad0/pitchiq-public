// Locale-aware navigation. Internal links use these so the active locale is
// carried automatically (the i18n analogue of the `withSeason` season-carry
// helper). English stays un-prefixed via the routing's `as-needed` prefix.
//
// TASK-1703: `Link` is the View-Transition wrapper (zoom-fade route
// transitions) around the raw next-intl Link — this module is the single seam
// every internal link imports, so wrapping here animates the whole app. The
// raw primitives live in ./navigation-base (avoids a wrapper↔base cycle);
// `redirect`/`getPathname` stay server-safe because only the wrapper file is
// `"use client"`. Unit tests alias this module to tests/stubs/i18n-navigation.
export { Link } from "@/components/TransitionLink";
export { redirect, usePathname, useRouter, getPathname } from "./navigation-base";
