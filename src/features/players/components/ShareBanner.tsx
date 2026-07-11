"use client";

import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/utils/cn";

const STORAGE_KEY = "compare:share-banner-dismissed";

export type ShareBannerProps = {
  className?: string;
};

// Per-session dismissible banner that nudges the user toward copying the
// `/compare` URL (the URL already encodes both player ids via nuqs, so
// it's directly shareable). Visibility is gated by the parent (the page
// only mounts this in the both-ids-resolved branch); this component's
// only job is the "show until I dismiss this session" lifecycle.
//
// Two render-time concerns:
//   1. **No SSR/CSR hydration mismatch.** Server has no sessionStorage,
//      so the initial render must be deterministic. We render `null`
//      on the first synchronous pass and only flip to the visible
//      banner after the mount-effect runs and reads sessionStorage.
//      Trade-off: a one-frame "appears after hydration" flicker on
//      fresh sessions. Acceptable for an informational banner; the
//      alternative (server-render + remove on client when dismissed)
//      would either flash the banner before hiding it or require a
//      cookie round-trip.
//   2. **Per-session, not forever.** `sessionStorage` is wiped when the
//      tab closes — that's the AC. localStorage would persist across
//      sessions which contradicts "don't reappear on refresh within
//      the same session" but-still-do across new sessions.
export function ShareBanner({ className }: ShareBannerProps) {
  const t = useTranslations("compare");
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(sessionStorage.getItem(STORAGE_KEY) === "1");
    setMounted(true);
  }, []);

  if (!mounted || dismissed) return null;

  return (
    <div
      role="status"
      className={cn(
        "bg-primary/5 text-foreground flex items-center gap-3 rounded-md border px-4 py-2 text-sm",
        className,
      )}
    >
      <span className="flex-1">{t("shareBanner")}</span>
      <button
        type="button"
        onClick={() => {
          sessionStorage.setItem(STORAGE_KEY, "1");
          setDismissed(true);
        }}
        aria-label={t("dismissShareBanner")}
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="size-4" aria-hidden />
      </button>
    </div>
  );
}
