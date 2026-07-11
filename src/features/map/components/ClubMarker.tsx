import type { CSSProperties } from "react";

import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/navigation";

import type { GeoClub } from "@/data/geo-reference";
import { clubLogo, type LogoVariant } from "@/utils/club-logo";
import { formatSeasonLabel, withSeason } from "@/utils/season";

export type MarkerClub = GeoClub & {
  name: string;
  crest: string;
  color: string;
  // Historical crest variants (TASK-M54) so the badge re-resolves to the
  // era-correct crest as the season slider moves; omitted → the current crest.
  logoVariants?: LogoVariant[];
};

// One crest badge, absolutely positioned by x/y%. Active → full colour + an
// era-accent glow; absent → dimmed/greyscale (CSS via [data-active]). Hovering
// shows the name; clicking → the club page carrying `linkSeason` (the viewed
// season when active, else the club's most recent top-flight season so a
// dormant club doesn't land on an empty page). Absent clubs stay hoverable so
// the dormant history is explorable.
export function ClubMarker({
  club,
  active,
  season,
  linkSeason,
}: {
  club: MarkerClub;
  active: boolean;
  season: number;
  linkSeason: number;
}) {
  const t = useTranslations("map");
  const locale = useLocale();
  const label = active
    ? t("markerActive", { name: club.name, season: formatSeasonLabel(season, locale) })
    : t("markerInactive", { name: club.name, season: formatSeasonLabel(season, locale) });
  // The era-correct crest for the slider's season (TASK-M54).
  const crest = clubLogo(club.teamId, season, club.logoVariants);
  return (
    <Link
      href={withSeason(`/teams/${club.teamId}`, linkSeason)}
      aria-label={label}
      data-active={active ? "true" : "false"}
      className="club-marker"
      style={{ left: `${club.x}%`, top: `${club.y}%`, "--kit": club.color } as CSSProperties}
    >
      <span className="club-marker__badge">
        <Image src={crest} alt="" width={28} height={28} className="club-marker__crest" />
      </span>
      <span className="club-marker__name" aria-hidden="true">
        {club.name}
      </span>
    </Link>
  );
}
