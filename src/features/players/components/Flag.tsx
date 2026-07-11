import { cn } from "@/utils/cn";

/**
 * A country flag via the `flag-icons` CSS package (TASK-M15). `code` is a
 * flag-icons key (ISO alpha-2 lowercased, or `gb-eng`/`gb-sct`/`gb-wls`/`gb-nir`).
 * Renders nothing when `code` is null so callers can pass it unconditionally.
 */
export function Flag({
  code,
  name,
  className,
}: {
  code: string | null;
  name: string | null;
  className?: string;
}) {
  if (!code) return null;
  return (
    <span
      className={cn("fi", `fi-${code}`, "shrink-0 rounded-[2px]", className)}
      role="img"
      aria-label={name ?? undefined}
      title={name ?? undefined}
    />
  );
}
