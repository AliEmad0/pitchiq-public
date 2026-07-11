import { getTranslations } from "next-intl/server";
import { ScanSearch } from "lucide-react";

// Default App Router loading boundary (TASK-1503 "VAR review" theme). Any
// segment without its own `loading.tsx` falls back here while its
// server-rendered children stream in. The Header/Footer chrome stays mounted
// (this slots inside <main>) so the app frame keeps its identity during
// navigation. Motion is a gentle pulse only — Phase 17 layers richer animation.
// Copy localized via getTranslations (TASK-1603).
export default async function Loading() {
  const t = await getTranslations("boundaries");
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center"
    >
      <span className="text-primary bg-muted inline-flex animate-pulse items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-semibold tracking-wide uppercase">
        <ScanSearch className="size-3.5" aria-hidden />
        {t("loadingBadge")}
      </span>
      <span className="text-muted-foreground text-sm">{t("loadingHint")}</span>
    </div>
  );
}
