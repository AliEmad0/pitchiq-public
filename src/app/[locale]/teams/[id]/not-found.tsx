import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

import { BoundaryPanel } from "@/components/BoundaryPanel";
import { Button } from "@/components/ui/button";

// Route-scoped 404 for `/teams/[id]` (TASK-1503 "VAR review" panel). Triggered
// when the URL param isn't an integer or `getTeam(id)` resolves to null (the
// team id isn't in the current Premier League snapshot). Server Component;
// copy is localized via getTranslations (TASK-1603).
export default async function TeamNotFound() {
  const t = await getTranslations("notFound");
  const tb = await getTranslations("boundaries");
  const tn = await getTranslations("nav");
  return (
    <BoundaryPanel
      tag={tb("notFoundTag")}
      title={t("teamTitle")}
      description={
        <>
          <p>{t("teamDescription1")}</p>
          <p>{t("teamDescription2")}</p>
        </>
      }
    >
      <Button asChild>
        <Link href="/teams">{t("browseAllClubs")}</Link>
      </Button>
      <Button asChild variant="outline">
        <Link href="/">{tn("dashboard")}</Link>
      </Button>
    </BoundaryPanel>
  );
}
