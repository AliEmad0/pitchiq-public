import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";

import { routing } from "./routing";

// Per-request message loader. Messages are static JSON bundled at build time —
// no outbound/per-request fetch, so SSG + the daily data cron are unaffected.
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  // NOTE: the locale must stay one of the routing locales ("en"/"ar") — next-intl's
  // locale-aware `usePathname`/`Link` strip the URL prefix by it, so a non-routing
  // locale (e.g. "ar-u-nu-arab") breaks the locale switcher. Arabic-Indic digits in
  // ICU `#`/count args are instead handled at the call site via `localizeDigits`
  // (see the plural messages that pass a pre-localized `{n}` display arg).
  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
