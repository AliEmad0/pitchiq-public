"use client";

import { useTranslations } from "next-intl";
import { Check, Copy } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

// Small client island for the `/compare` page's "share this comparison"
// affordance (TASK-408). Copies `window.location.href` to the clipboard
// and flashes "Copied!" feedback for 2 s. The URL is already the full
// shareable state thanks to nuqs writing `?a=<id>&b=<id>` to the address
// bar — we don't have to construct anything.
export function CopyCompareLink() {
  const t = useTranslations("compare");
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      // Reset after 2 s so the button settles back to its default state.
      // No leak concern: if the component unmounts, the user can't see
      // the stale flag anyway.
      setTimeout(() => setCopied(false), 2_000);
    } catch {
      // Clipboard can fail on http://localhost without HTTPS in some
      // browsers, or when the document isn't focused. Silently swallow
      // — the user can still copy the URL from the address bar.
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleClick} aria-live="polite">
      {copied ? (
        <>
          <Check className="size-4" aria-hidden />
          {t("copied")}
        </>
      ) : (
        <>
          <Copy className="size-4" aria-hidden />
          {t("copyLink")}
        </>
      )}
    </Button>
  );
}
