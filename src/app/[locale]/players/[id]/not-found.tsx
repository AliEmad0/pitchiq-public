import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

import { BoundaryPanel } from "@/components/BoundaryPanel";
import { Button } from "@/components/ui/button";

// Route-scoped 404 for `/players/[id]` (TASK-1503 "VAR review" panel). Triggered
// when the URL param isn't an integer or `getPlayerProfile(id)` resolves to null
// (the player id isn't in the selected season's snapshot). Copy is localized via
// getTranslations (TASK-1603).
export default async function PlayerNotFound() {
  const t = await getTranslations("notFound");
  const tb = await getTranslations("boundaries");
  const tn = await getTranslations("nav");
  return (
    <BoundaryPanel
      tag={tb("notFoundTag")}
      title={t("playerTitle")}
      description={
        <>
          <p>{t("playerDescription1")}</p>
          <p>{t("playerDescription2")}</p>
        </>
      }
    >
      <Button asChild>
        <Link href="/compare">{t("comparePlayers")}</Link>
      </Button>
      <Button asChild variant="outline">
        <Link href="/">{tn("dashboard")}</Link>
      </Button>
    </BoundaryPanel>
  );
}
