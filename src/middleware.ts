import createMiddleware from "next-intl/middleware";

import { routing } from "@/i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Skip API, the Sentry monitoring tunnel, Next internals, and any path with a
  // file extension (metadata/asset conventions: sitemap.xml, robots.txt,
  // manifest.webmanifest, icon.svg, apple-icon, opengraph-image). Those must not
  // be locale-rewritten.
  matcher: "/((?!api|monitoring|_next|_vercel|.*\\..*).*)",
};
