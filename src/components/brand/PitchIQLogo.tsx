import { useLocale } from "next-intl";

import { cn } from "@/utils/cn";
import { isRtl } from "@/utils/format";

const GRAD_ID = "pitchiq-grad";

/**
 * PitchIQ brand mark — a magenta rounded-square tile with a "pitch from above"
 * (halfway line + centre circle). Single source of truth for the logo; reused
 * by the header. Pure SVG mark, server-safe. Reuses the app's magenta palette.
 *
 * The wordmark is locale-aware: English "PitchIQ", Arabic "بيتش آي كيو" in the
 * Nastaliq calligraphic face (owner-picked design #6, `--font-nastaliq`), with
 * "آي كيو" in the magenta accent — the Arabic twin of "Pitch" + "IQ".
 * `useLocale()` is isomorphic (works in the sync Server Components that render
 * the header/footer).
 */
export function PitchIQLogo({
  size = 28,
  withWordmark = false,
  className,
}: {
  size?: number;
  withWordmark?: boolean;
  className?: string;
}) {
  const locale = useLocale();
  const mark = (
    <svg width={size} height={size} viewBox="0 0 44 44" aria-hidden="true">
      <defs>
        <linearGradient id={GRAD_ID} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e22fd0" />
          <stop offset="1" stopColor="#a3179a" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="40" height="40" rx="12" fill={`url(#${GRAD_ID})`} />
      <line x1="22" y1="8" x2="22" y2="36" stroke="#fff" strokeWidth="2" opacity="0.9" />
      <circle cx="22" cy="22" r="7" fill="none" stroke="#fff" strokeWidth="2" opacity="0.9" />
      <circle cx="22" cy="22" r="1.7" fill="#fff" />
    </svg>
  );

  if (!withWordmark) return <span className={className}>{mark}</span>;

  if (isRtl(locale)) {
    return (
      <span className={cn("flex items-center gap-2", className)}>
        {mark}
        {/* Nastaliq has tall ascenders/descenders — keep it modest so it sits
            level with the mark instead of overflowing it. */}
        <span
          className="text-sm leading-tight font-bold"
          style={{ fontFamily: "var(--font-nastaliq), var(--font-arabic), serif" }}
        >
          بيتش <span className="text-primary">آي كيو</span>
        </span>
      </span>
    );
  }

  return (
    <span className={cn("flex items-center gap-2", className)}>
      {mark}
      <span className="text-base font-bold tracking-tight">
        Pitch<span className="text-primary">IQ</span>
      </span>
    </span>
  );
}
