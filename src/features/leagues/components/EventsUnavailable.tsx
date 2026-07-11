import { useTranslations } from "next-intl";
import { Clock } from "lucide-react";

import { Card } from "@/components/ui/card";

/**
 * Per-fixture empty-state card replacing `<EventTimeline>` on `/fixtures/[id]`
 * when no event data exists for that match. Phase 10 adds real events (goals,
 * cards, subs) from TheSportsDB for covered fixtures (≈ 2021-26); older or
 * not-yet-ingested matches fall back to this card.
 */
export function EventsUnavailable() {
  const t = useTranslations("fixtures");
  return (
    <Card
      role="status"
      aria-label={t("eventsUnavailableTitle")}
      className="flex flex-col items-center gap-3 p-8 text-center"
    >
      <Clock className="text-muted-foreground size-10" aria-hidden />
      <h3 className="text-base font-semibold">{t("eventsUnavailableTitle")}</h3>
      <p className="text-muted-foreground max-w-md text-sm">{t("eventsUnavailableMsg")}</p>
    </Card>
  );
}
