import { useTranslations } from "next-intl";
import { UserRoundX } from "lucide-react";

import { Card } from "@/components/ui/card";

/**
 * Per-fixture empty-state card replacing `<PitchLineup>` on `/fixtures/[id]`
 * when no lineup data exists for that match. Phase 10 adds real lineups from
 * TheSportsDB for covered fixtures (≈ 2021-26); older or not-yet-ingested
 * matches fall back to this card rather than a broken pitch SVG.
 */
export function LineupUnavailable() {
  const t = useTranslations("fixtures");
  return (
    <Card
      role="status"
      aria-label={t("lineupsUnavailableTitle")}
      className="flex flex-col items-center gap-3 p-8 text-center"
    >
      <UserRoundX className="text-muted-foreground size-10" aria-hidden />
      <h3 className="text-base font-semibold">{t("lineupsUnavailableTitle")}</h3>
      <p className="text-muted-foreground max-w-md text-sm">{t("lineupsUnavailableMsg")}</p>
    </Card>
  );
}
