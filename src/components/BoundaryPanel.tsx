import type { LucideIcon } from "lucide-react";
import { ScanSearch } from "lucide-react";
import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";
import { cn } from "@/utils/cn";

// Shared "VAR review" boundary card (TASK-1503, concept #7). A left-accent
// panel led by a "VAR · {tag}" badge — used by the error + not-found boundaries
// (global and per-route). Presentational and server-safe (no client hooks) so
// Server-Component 404s can render it directly; the client `error.tsx` wraps it
// for the reset handler.
export function BoundaryPanel({
  tag,
  title,
  description,
  children,
  icon: Icon = ScanSearch,
  tone = "primary",
}: {
  // Short badge suffix, e.g. "No decision" (404) or "Error" (error boundary).
  tag: string;
  title: string;
  // Body copy — a string, or JSX (e.g. multiple <p>s) rendered in a stacked box.
  description: ReactNode;
  // Actions (buttons / links) shown below the copy.
  children?: ReactNode;
  icon?: LucideIcon;
  tone?: "primary" | "danger";
}) {
  const isDanger = tone === "danger";
  return (
    <div className="flex flex-1 items-center justify-center p-6 md:p-8">
      <Card
        className={cn(
          "w-full max-w-md gap-0 border-s-4 p-6",
          isDanger ? "border-s-destructive" : "border-s-primary",
        )}
      >
        <span
          className={cn(
            "bg-muted inline-flex w-fit items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold tracking-wide uppercase",
            isDanger ? "text-destructive" : "text-primary",
          )}
        >
          <Icon className="size-3.5" aria-hidden />
          VAR · {tag}
        </span>
        <h1 className="mt-4 text-lg font-semibold">{title}</h1>
        <div className="text-muted-foreground mt-1.5 space-y-2 text-sm">{description}</div>
        {children ? <div className="mt-5 flex flex-wrap gap-2">{children}</div> : null}
      </Card>
    </div>
  );
}
