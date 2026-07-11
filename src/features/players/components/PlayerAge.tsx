"use client";

import { useLocale } from "next-intl";
import { useEffect, useState } from "react";

import { ageBetween, isoToday } from "@/utils/age";
import { localizeDigits } from "@/utils/format";

/**
 * A player's age, kept current on the client (TASK-M40). The server passes the
 * seed `age` (computed at build time), which SSR + the first client render use
 * — so there's no hydration mismatch. After mount, a LIVING player's age is
 * recomputed against today's date, so a statically-prerendered page never shows
 * a stale age. A deceased player's age stays frozen at the seed (age at death).
 * Renders nothing when no age is known.
 */
export function PlayerAge({
  age,
  birthDate,
  dateOfDeath,
  prefix = "Age ",
}: {
  age: number | null;
  birthDate: string | null;
  dateOfDeath: string | null;
  prefix?: string;
}) {
  const locale = useLocale();
  const [display, setDisplay] = useState<number | null>(age);
  useEffect(() => {
    if (!dateOfDeath && birthDate) setDisplay(ageBetween(birthDate, isoToday()));
  }, [birthDate, dateOfDeath]);
  if (display === null) return null;
  return (
    <span>
      {prefix}
      {localizeDigits(display, locale)}
    </span>
  );
}
