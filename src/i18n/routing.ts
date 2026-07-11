import { defineRouting } from "next-intl/routing";

// TASK-1601 — locale routing. Path-prefix with `as-needed`: the default locale
// (en) keeps un-prefixed URLs (/teams/42); Arabic is served under /ar/*.
//
// `localeDetection: false` (TASK-1602) makes English the guaranteed default: the
// bare "/" always serves English regardless of the visitor's Accept-Language
// header, instead of auto-redirecting an Arabic-locale browser to /ar. Arabic is
// opt-in via the header switcher (which persists the choice in the URL + cookie).
export const routing = defineRouting({
  locales: ["en", "ar"],
  defaultLocale: "en",
  localePrefix: "as-needed",
  localeDetection: false,
});
