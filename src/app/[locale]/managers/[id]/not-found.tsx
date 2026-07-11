import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

import { BoundaryPanel } from "@/components/BoundaryPanel";
import { Button } from "@/components/ui/button";

// Route-scoped 404 for `/managers/[id]` (TASK-1503 "VAR review" panel). Copy is
// localized via getTranslations (TASK-1603).
export default async function NotFound() {
  const t = await getTranslations("notFound");
  const tb = await getTranslations("boundaries");
  const tn = await getTranslations("nav");
  return (
    <BoundaryPanel
      tag={tb("notFoundTag")}
      title={t("managerTitle")}
      description={t("managerDescription")}
    >
      <Button asChild>
        <Link href="/managers">{t("browseManagers")}</Link>
      </Button>
      <Button asChild variant="outline">
        <Link href="/">{tn("dashboard")}</Link>
      </Button>
    </BoundaryPanel>
  );
}
