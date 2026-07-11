import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

import { PitchIQLogo } from "@/components/brand/PitchIQLogo";
import { loadMeta } from "@/data/loaders";
import { relativeTimeFromNow } from "@/utils/relative-time";

const REPO_URL = "https://github.com/AliEmad0/pitchiq";
const COMMONS_URL = "https://commons.wikimedia.org/";
const WIKIPEDIA_MANAGERS_URL = "https://en.wikipedia.org/wiki/List_of_Premier_League_managers";

// Link labels reuse the `nav` message keys (TASK-1603) so the football-domain
// terms are translated once.
const EXPLORE = [
  { href: "/teams", key: "teams" },
  { href: "/players", key: "players" },
  { href: "/managers", key: "managers" },
  { href: "/map", key: "map" },
] as const;

const COMPETE = [
  { href: "/leaderboards", key: "leaderboards" },
  { href: "/fixtures", key: "fixtures" },
  { href: "/compare", key: "compare" },
] as const;

// Phase 15 redesign (TASK-1502): multi-column footer — brand + tagline, two
// columns of internal links, and the data/credit column. The "refreshed daily"
// copy was dropped (owner request); the freshness now reads only as the
// "Data updated X ago" stamp.
//
// Async server component (TASK-M22): reads `data/_meta.json.lastRefresh` for the
// relative stamp. `loadMeta` is a local file read (no dynamic APIs), so pages
// stay statically prerendered; the stamp reflects the data baked into the build.
export async function Footer() {
  const meta = await loadMeta();
  const locale = await getLocale();
  const updated = meta ? relativeTimeFromNow(meta.lastRefresh, locale) : "";
  const year = new Date().getFullYear();
  const t = await getTranslations("footer");
  const tn = await getTranslations("nav");
  const explore = EXPLORE.map((l) => ({ href: l.href, label: tn(l.key) }));
  const compete = COMPETE.map((l) => ({ href: l.href, label: tn(l.key) }));

  return (
    <footer className="text-foreground/70 border-t text-sm">
      <div className="container-page py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-3">
            <PitchIQLogo withWordmark />
            {/* The ONLY "Premier League, decoded." string in the footer — the
                AppShell E2E (home.spec) targets it with an unscoped getByText. */}
            <p className="text-muted-foreground max-w-[24ch]">{t("taglineFull")}</p>
          </div>

          <FooterCol title={t("explore")} links={explore} />
          <FooterCol title={t("compete")} links={compete} />

          <nav className="flex flex-col gap-2" aria-label={t("data")}>
            {/* Column labels are plain text, not headings — the footer is global,
                so adding <h2>s here would pollute every page's heading tree (and
                break unscoped getByRole("heading") queries). The <nav aria-label>
                provides the landmark grouping. */}
            <p className="text-foreground text-sm font-semibold">{t("data")}</p>
            <FooterExternal href={COMMONS_URL}>{t("photosCredit")}</FooterExternal>
            <FooterExternal href={WIKIPEDIA_MANAGERS_URL}>{t("managersCredit")}</FooterExternal>
            <FooterExternal href={REPO_URL}>{t("github")}</FooterExternal>
          </nav>
        </div>

        <div className="text-muted-foreground mt-8 flex flex-col items-start justify-between gap-2 border-t pt-6 text-xs sm:flex-row sm:items-center">
          <span>{t("copyright", { year })}</span>
          {updated ? (
            <span title={formatAbsolute(meta!.lastRefresh, locale)}>
              {t("dataUpdated", { ago: updated })}
            </span>
          ) : null}
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <nav className="flex flex-col gap-2" aria-label={title}>
      <p className="text-foreground text-sm font-semibold">{title}</p>
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}

function FooterExternal({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-muted-foreground hover:text-foreground underline-offset-2 transition-colors hover:underline"
    >
      {children}
    </a>
  );
}

// Absolute date for the freshness stamp's hover title, e.g. "20 Jun 2026" /
// "20 يونيو 2026" (Arabic names, Western digits — TASK-1605).
function formatAbsolute(iso: string, locale = "en-GB"): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    numberingSystem: "latn",
  }).format(d);
}
