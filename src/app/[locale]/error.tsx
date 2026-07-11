"use client";

import { useTranslations } from "next-intl";
import { RotateCw } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useEffect } from "react";

import { BoundaryPanel } from "@/components/BoundaryPanel";
import { Button } from "@/components/ui/button";
import { logger } from "@/utils/logger";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

// App Router error boundary. Must be a Client Component (Next requires the
// `"use client"` directive at this path) because it owns the `reset` handler
// and the useEffect log-on-mount. The boundary stops the error from bubbling
// to the root and re-renders this UI in place of the failing segment.
//
// `logger.error("route.error", …)` is the canonical structured-log key for any
// downstream observability sink (TASK-005 will pipe these to Sentry).
export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    logger.error("route.error", {
      name: error.name,
      message: error.message,
      stack: error.stack,
      digest: error.digest,
    });
  }, [error]);

  const t = useTranslations("boundaries");
  const tc = useTranslations("common");

  return (
    <BoundaryPanel
      tone="danger"
      tag={t("errorTag")}
      title={t("errorTitle")}
      description={t("errorDescription")}
    >
      <Button onClick={reset}>
        <RotateCw aria-hidden />
        {tc("tryAgain")}
      </Button>
      <Button asChild variant="outline">
        <Link href="/">{tc("backToDashboard")}</Link>
      </Button>
    </BoundaryPanel>
  );
}
