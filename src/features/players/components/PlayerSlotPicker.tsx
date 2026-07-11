"use client";

import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Flag } from "@/features/players/components/Flag";
import { PlayerAge } from "@/features/players/components/PlayerAge";
import { PlayerImage } from "@/features/players/components/PlayerImage";
import { PlayerSearch } from "@/features/players/components/PlayerSearch";
import type { PlayerSearchHit } from "@/features/players/api";
import { useComparisonSelection } from "@/hooks/useComparisonSelection";
import { cn } from "@/utils/cn";
import { formatSeasonLabel, withSeason } from "@/utils/season";
import { prefersReducedMotion, runViewTransition } from "@/utils/view-transition";

export type PlayerSlotPickerProps = {
  // Which `useComparisonSelection()` slot this picker drives. Two pickers
  // mount side-by-side on `/compare`: one with `slot="A"`, one with
  // `slot="B"`.
  slot: "A" | "B";
  // Optional season override; mirrors PlayerSearch's `season` prop. Both
  // the hydrate fetch and the inner search forward it.
  season?: number;
  className?: string;
};

// One side of the `/compare` head-to-head. Backed by
// `useComparisonSelection()` — the URL is the source of truth for which
// player occupies the slot (`?a=<id>` / `?b=<id>`). Two states:
//
//   - **Empty:** render `<PlayerSearch>`; on pick, `setSlot(slot, hit.id)`
//     writes the id into the URL, which re-renders us into the populated
//     state.
//   - **Populated:** the URL has an id but we don't have the display
//     data in-memory (page reload / inbound deeplink). We fetch the slim
//     `{ id, name, team, photo }` shape from `/api/players/[id]` (TASK-
//     403 sibling, shares the same `/players?id=` cache as
//     `getPlayerStats` for free) and render a card with a Change button
//     that clears the slot.
//
// A 404 on the hydrate fetch (e.g. URL has a player id from a previous
// season that no longer resolves) is treated as stale URL state: we
// `setSlot(slot, null)` and the slot reverts to the empty/search state.
export function PlayerSlotPicker({ slot, season, className }: PlayerSlotPickerProps) {
  const t = useTranslations("compare");
  const tc = useTranslations("common");
  const locale = useLocale();
  const { slotA, slotB, seasonA, seasonB, setSlot, setSlotSeason } = useComparisonSelection();
  const playerId = slot === "A" ? slotA : slotB;
  const slotSeason = slot === "A" ? seasonA : seasonB; // string | null

  // The seasons this player appears in (newest-first), for the per-slot
  // dropdown. Season-independent → cached by id.
  const { data: seasonsList } = useQuery<number[], Error>({
    queryKey: ["playerSeasons", playerId],
    queryFn: async () => {
      const res = await fetch(`/api/players/${playerId}/seasons`);
      if (!res.ok) return [];
      const json = (await res.json()) as { seasons?: number[] };
      return Array.isArray(json.seasons) ? json.seasons : [];
    },
    enabled: playerId != null,
    staleTime: 300_000,
  });

  // Which season to hydrate the identity card against: the chosen slot season,
  // or for "All seasons" the player's latest season (so name/photo/team still
  // render). Falls back to the global `season` prop until the list loads.
  const latest = seasonsList?.[0];
  const effectiveSeason =
    slotSeason === "all" ? latest : slotSeason != null ? Number(slotSeason) : season;

  const { data, isFetching, isError, error } = useQuery<PlayerSearchHit | null, Error>({
    // `locale` in the key so the Arabic + Latin slot cards cache separately
    // (TASK-1606 follow-up — the card localizes name/club/position/nationality).
    queryKey: ["playerSlim", playerId, effectiveSeason ?? "current", locale],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (effectiveSeason !== undefined) params.set("season", String(effectiveSeason));
      params.set("locale", locale);
      const res = await fetch(`/api/players/${playerId}?${params.toString()}`);
      if (!res.ok) {
        // 404 → unknown id, surfaced to the effect below which clears
        // the slot. 5xx / network → same UX (slot clears), differentiate
        // via the `cause` if a future ticket needs to distinguish.
        throw new Error(`player_lookup_failed:${res.status}`, {
          cause: res.status,
        });
      }
      return (await res.json()) as PlayerSearchHit;
    },
    enabled: playerId != null,
    staleTime: 60_000,
  });

  // Stale-slot self-heal: when the hydrate fetch fails (404 / 5xx / net),
  // clear this slot so the search input comes back. The effect runs
  // exactly once per failed query thanks to the `error` reference
  // changing on a fresh failure.
  useEffect(() => {
    if (isError && playerId != null) {
      setSlot(slot, null);
    }
    // `setSlot` from nuqs is stable across renders; depending on it is
    // safe and keeps the dep array honest.
  }, [isError, playerId, slot, setSlot, error]);

  // Filled pulse (TASK-910): flash the slot for 600ms when it goes empty →
  // populated via a user pick. `wasEmptyRef` starts true only when the slot
  // mounts empty, so an inbound deeplink (slot already filled on load) doesn't
  // pulse. Reduced-motion skips it.
  const wasEmptyRef = useRef(playerId == null);
  const [justFilled, setJustFilled] = useState(false);
  useEffect(() => {
    if (playerId == null) {
      wasEmptyRef.current = true;
      setJustFilled(false);
      return;
    }
    if (data && wasEmptyRef.current) {
      wasEmptyRef.current = false;
      if (prefersReducedMotion()) return;
      setJustFilled(true);
      const t = setTimeout(() => setJustFilled(false), 600);
      return () => clearTimeout(t);
    }
  }, [playerId, data]);

  // --- Empty state -------------------------------------------------------
  if (playerId == null) {
    return (
      <div className={cn("space-y-2", className)} data-testid={`slot-${slot.toLowerCase()}-empty`}>
        <p className="text-muted-foreground text-sm font-medium">{t("pickPlayer", { slot })}</p>
        <PlayerSearch
          season={season}
          crossSeason
          placeholder={t("searchPlayerSlot", { slot })}
          // A fresh pick defaults to "All seasons" (career aggregate, owner
          // request) — the per-slot dropdown then lets the user narrow to a
          // single season. The identity card hydrates against the player's
          // latest season so name/photo/team still render.
          onSelect={(hit) => runViewTransition(() => setSlot(slot, hit.id, "all"))}
        />
      </div>
    );
  }

  // --- Loading state during hydrate -------------------------------------
  if (isFetching && !data) {
    return (
      <Card
        className={cn("flex items-center gap-3 p-4", className)}
        data-testid={`slot-${slot.toLowerCase()}-loading`}
        role="status"
        aria-label={t("loadingPlayer", { slot })}
      >
        <span className="bg-muted size-12 shrink-0 animate-pulse rounded-full" />
        <span className="bg-muted h-4 flex-1 animate-pulse rounded" />
      </Card>
    );
  }

  // --- Error state — covered by the self-heal effect above; this branch
  // shouldn't normally render because the effect flips us back to empty
  // before the next paint, but it guards against the one-tick gap.
  if (isError || !data) return null;

  // --- Populated state (TASK-1513 magazine card) -------------------------
  // Full-height rectangular photo on the left, editorial block on the right:
  // name, position, nationality flag + live age, club crest + name, and the
  // per-slot season control. The card's `overflow-hidden` clips the photo to
  // the rounded corners; the `--primary` top edge matches the other redesigned
  // player cards.
  return (
    <Card
      className={cn(
        "flex flex-row items-stretch gap-3 overflow-hidden border-t-4 border-t-primary p-0",
        className,
      )}
      data-testid={`slot-${slot.toLowerCase()}-populated`}
      data-just-filled={justFilled ? "true" : undefined}
      style={{ viewTransitionName: `player-card-${data.id}` }}
    >
      <div className="bg-muted relative w-24 shrink-0 self-stretch overflow-hidden sm:w-28">
        <PlayerImage
          player={data}
          size="lg"
          className="size-full rounded-none object-cover object-top"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              href={withSeason(`/players/${data.id}`, season)}
              className="block truncate font-semibold hover:underline"
            >
              {data.name}
            </Link>
            {data.position ? (
              <p className="text-muted-foreground truncate text-xs">{data.position}</p>
            ) : null}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={() => setSlot(slot, null)}
          >
            {t("change")}
          </Button>
        </div>

        {/* Nationality flag + live age (TASK-1513, reusing the M15/M40 bits). */}
        {data.nationality || data.age != null ? (
          <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <Flag
              code={data.nationalityCode ?? null}
              name={data.nationality ?? null}
              className="text-sm"
            />
            {data.nationality ? <span className="truncate">{data.nationality}</span> : null}
            {data.age != null ? (
              <>
                <span aria-hidden>·</span>
                <PlayerAge
                  age={data.age}
                  birthDate={data.birthDate ?? null}
                  dateOfDeath={data.dateOfDeath ?? null}
                  prefix={t("agePrefix")}
                />
              </>
            ) : null}
          </p>
        ) : null}

        {/* Club crest + team name (crest decorative — the link is labelled). */}
        <Link
          href={withSeason(`/teams/${data.team.id}`, season)}
          aria-label={tc("viewTeamPage", { team: data.team.name })}
          className="text-muted-foreground flex items-center gap-1.5 text-xs hover:underline"
        >
          {data.team.logo ? (
            <Image
              src={data.team.logo}
              alt=""
              width={16}
              height={16}
              className="size-4 shrink-0 object-contain"
              unoptimized
            />
          ) : null}
          <span className="truncate">{data.team.name}</span>
        </Link>

        {/* Per-slot season (TASK-M24): scope to this player's seasons + an
            "All seasons" career aggregate. Writes `?sa=`/`?sb=`. */}
        {seasonsList && seasonsList.length > 0 && (
          <Select
            value={slotSeason ?? String(season ?? seasonsList[0])}
            onValueChange={(value) => setSlotSeason(slot, value === "all" ? "all" : Number(value))}
          >
            <SelectTrigger
              aria-label={t("seasonForPlayer", { slot })}
              className="mt-1 h-7 w-[130px] text-xs tabular-nums"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">
                {t("allSeasons")}
              </SelectItem>
              {seasonsList.map((s) => (
                <SelectItem key={s} value={String(s)} className="text-xs tabular-nums">
                  {formatSeasonLabel(s, locale)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </Card>
  );
}
