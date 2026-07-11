import { useTranslations } from "next-intl";

import { cn } from "@/utils/cn";

/**
 * Captain's-armband marker (TASK-M41) — a small "C" badge shown next to a team
 * captain's name on the squad card + player page. Sized via `className`.
 */
export function CaptainBadge({ className }: { className?: string }) {
  const t = useTranslations("common");
  const label = t("clubCaptain");
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={cn(
        "bg-primary text-primary-foreground inline-flex shrink-0 items-center justify-center rounded font-bold",
        "size-4 text-[0.6rem] leading-none",
        className,
      )}
    >
      C
    </span>
  );
}
