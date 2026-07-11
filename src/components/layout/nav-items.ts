// Primary site navigation. Shared between the desktop Header (TASK-102)
// and the mobile drawer (TASK-103) so a route addition lives in exactly
// one place.
// `key` indexes the `nav` message namespace (src/i18n/messages/*.json) so the
// nav renders localized labels (TASK-1601); `label` stays as the English
// fallback / test anchor.
export const NAV_ITEMS = [
  { href: "/", label: "Dashboard", key: "dashboard" },
  { href: "/teams", label: "Teams", key: "teams" },
  { href: "/managers", label: "Managers", key: "managers" },
  { href: "/players", label: "Players", key: "players" },
  { href: "/leaderboards", label: "Leaderboards", key: "leaderboards" },
  { href: "/fixtures", label: "Fixtures", key: "fixtures" },
  { href: "/compare", label: "Compare", key: "compare" },
  { href: "/map", label: "Map", key: "map" },
] as const;

export type NavItem = (typeof NAV_ITEMS)[number];

// Phase 15 redesign (TASK-1502): the desktop header renders a segmented pill
// nav. These hrefs show inline; everything else in NAV_ITEMS folds into a
// "More ▾" dropdown. The mobile drawer + footer still use the full NAV_ITEMS
// list, so a route addition only needs a decision here about primary vs
// overflow placement.
export const PRIMARY_NAV_HREFS: readonly string[] = [
  "/",
  "/teams",
  "/players",
  "/fixtures",
  "/compare",
];
