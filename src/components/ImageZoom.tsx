"use client";

import { type ReactNode } from "react";

import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/utils/cn";

/**
 * Wraps a small image (a player photo, a club crest, a stadium shot, …) so
 * clicking it opens a lightbox with the image shown BIG — the point is to see
 * the detail. `children` is the thumbnail rendered in place; `src` is the same
 * image shown large in the dialog.
 *
 * The dialog grows up to the viewport (`max-w-[92vw]` / `max-h-[86vh]`) and the
 * image keeps its natural aspect ratio (`object-contain`, `h/w-auto`), so a wide
 * stadium photo fills the width and a square crest stays square — never the old
 * fixed 320px square that shrank + letterboxed everything. A plain `<img>` is
 * used deliberately: `next/image`'s `fill` needs a fixed-aspect box, which is
 * exactly what made the enlarged image small.
 */
export function ImageZoom({
  src,
  alt,
  children,
  triggerClassName,
}: {
  src: string;
  alt: string;
  children: ReactNode;
  triggerClassName?: string;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={`Enlarge image: ${alt}`}
          className={cn("block cursor-zoom-in", triggerClassName)}
        >
          {children}
        </button>
      </DialogTrigger>
      <DialogContent
        className="w-auto max-w-[92vw] p-2 sm:max-w-[92vw]"
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">{alt}</DialogTitle>
        {/* eslint-disable-next-line @next/next/no-img-element -- lightbox: arbitrary-dimension image shown at natural size capped to the viewport */}
        <img
          src={src}
          alt={alt}
          className="mx-auto block h-auto max-h-[86vh] w-auto max-w-full rounded-lg object-contain"
        />
      </DialogContent>
    </Dialog>
  );
}
