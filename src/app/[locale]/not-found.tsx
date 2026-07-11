import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

import { BoundaryPanel } from "@/components/BoundaryPanel";
import { Button } from "@/components/ui/button";

// App Router 404 boundary (TASK-1503 "VAR review" panel). Server Component — no
// client APIs needed; Next renders this whenever a route doesn't match or a
// Server Component calls `notFound()`. The Header/Footer chrome stays mounted
// since this renders inside <main>. Copy is localized via getTranslations
// (TASK-1603).
export default async function NotFound() {
  const t = await getTranslations("boundaries");
  const tc = await getTranslations("common");
  return (
    <BoundaryPanel
      tag={t("notFoundTag")}
      title={t("notFoundTitle")}
      description={t("notFoundDescription")}
    >
      <Button asChild>
        <Link href="/">{tc("backToDashboard")}</Link>
      </Button>
    </BoundaryPanel>
  );
}
