import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { ImageZoom } from "@/components/ImageZoom";
import type { Team, Venue } from "@/types/api";
import { formatNumber, formatOrdinal, localizeDigits } from "@/utils/format";
import { revealProps } from "@/utils/reveal";

export type TeamHeroProps = {
  team: Team;
  venue: Venue;
  rank: number | null;
};

// Hero block above the squad: large logo, club name, founded year, venue
// (name + capacity), city, current league position. The rank is passed in
// rather than fetched here so the component stays presentational — TASK-305
// calls `getStandings` once at the page level and threads the result down.
export function TeamHero({ team, venue, rank }: TeamHeroProps) {
  const t = useTranslations("teams");
  const locale = useLocale();
  return (
    <header className="rounded-lg border bg-card p-4 lg:p-8" {...revealProps()}>
      <div className="grid gap-6 md:grid-cols-[200px_1fr]">
        <div className="flex items-start justify-center md:justify-start">
          <ImageZoom
            src={team.logo}
            alt={t("crestAlt", { name: team.name })}
            triggerClassName="inline-flex"
          >
            <Image
              src={team.logo}
              alt=""
              width={160}
              height={160}
              className="size-32 object-contain md:size-40"
              unoptimized
            />
          </ImageZoom>
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">{team.name}</h1>
            {team.code && (
              <span className="text-muted-foreground text-lg font-semibold">{team.code}</span>
            )}
          </div>

          {rank !== null && (
            <Badge variant="secondary" className="mt-2">
              {/* English "1st/2nd/3rd"; Arabic the ordinal WORD → "المركز الأول
                  في الدوري…" (the ar message prepends المركز). */}
              {t("rankInLeague", { rank: formatOrdinal(rank, locale) })}
            </Badge>
          )}

          <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:max-w-md">
            <div>
              <dt className="text-muted-foreground">{t("founded")}</dt>
              <dd className="mt-0.5 font-medium">
                {team.founded == null ? "—" : localizeDigits(team.founded, locale)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("country")}</dt>
              <dd className="mt-0.5 font-medium">{team.country}</dd>
            </div>
            {venue.name && (
              <div>
                <dt className="text-muted-foreground">{t("stadium")}</dt>
                <dd className="mt-0.5 font-medium">{venue.name}</dd>
              </div>
            )}
            {venue.capacity !== null && (
              <div>
                <dt className="text-muted-foreground">{t("capacity")}</dt>
                <dd className="mt-0.5 font-medium">{formatNumber(venue.capacity, locale)}</dd>
              </div>
            )}
            {venue.city && (
              <div>
                <dt className="text-muted-foreground">{t("city")}</dt>
                <dd className="mt-0.5 font-medium">{venue.city}</dd>
              </div>
            )}
            {team.website && (
              // TASK-M64 — official club site. External, new tab, noopener.
              // Omitted for defunct clubs (website null). The dt label is
              // localized; the link text is the bare domain (Latin, url-safe).
              <div>
                <dt className="text-muted-foreground">{t("website")}</dt>
                <dd className="mt-0.5 font-medium">
                  <a
                    href={team.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    {team.website.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
                  </a>
                </dd>
              </div>
            )}
          </dl>

          {venue.image && (
            // `max-w-md` on the bordered box (not the image) so the border
            // hugs the image instead of stretching to the full column width
            // (the border floated out to the right otherwise).
            <div className="mt-6 max-w-md overflow-hidden rounded-md border">
              {/* Click-to-enlarge, like the crest (owner request). */}
              <ImageZoom
                src={venue.image}
                alt={venue.name ? t("stadiumAlt", { name: venue.name }) : ""}
                triggerClassName="block w-full"
              >
                <Image
                  src={venue.image}
                  alt={venue.name ? t("stadiumAlt", { name: venue.name }) : ""}
                  width={640}
                  height={360}
                  priority
                  unoptimized
                  className="aspect-video w-full object-cover"
                />
              </ImageZoom>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
