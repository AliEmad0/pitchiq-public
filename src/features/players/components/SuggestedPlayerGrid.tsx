"use client";

import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";

import { localizeDigits } from "@/utils/format";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PlayerImage } from "@/features/players/components/PlayerImage";
import type { SuggestedPlayer, SuggestedPlayers } from "@/features/players/api";
import { useComparisonSelection } from "@/hooks/useComparisonSelection";
import { cn } from "@/utils/cn";
import { revealProps } from "@/utils/reveal";
import { runViewTransition } from "@/utils/view-transition";

export type SuggestedPlayerGridProps = {
  // Mirrors the slot pickers' `season` prop so the suggestions match the
  // selected season. Shares the TanStack Query cache key with `<PlayerSearch>`.
  season?: number;
  className?: string;
};

const MAX_CARDS = 6;

/**
 * Merge the two suggestion sections into one deduped list, carrying both stats
 * for a player who's in both (e.g. a top scorer who's also a top assister gets
 * one card with both badges). Scorers lead the ordering.
 */
function dedupe(data: SuggestedPlayers | undefined): SuggestedPlayer[] {
  if (!data) return [];
  const byId = new Map<number, SuggestedPlayer>();
  for (const p of data.topScorers) byId.set(p.id, { ...p });
  for (const p of data.topAssists) {
    const existing = byId.get(p.id);
    if (existing) existing.assists = p.assists;
    else byId.set(p.id, { ...p });
  }
  return [...byId.values()];
}

/**
 * `/compare` empty-state (TASK-605): a clickable grid of suggested players
 * (season top scorers + assisters) shown above the slot pickers while at least
 * one slot is empty. Clicking a card fills slot A first, then B. The parent
 * page gates visibility on `a === null || b === null`; this component
 * additionally hides itself once no un-picked suggestions remain.
 */
export function SuggestedPlayerGrid({ season, className }: SuggestedPlayerGridProps) {
  const t = useTranslations("compare");
  const locale = useLocale();
  const { slotA, slotB, setSlot } = useComparisonSelection();

  const { data } = useQuery<SuggestedPlayers, Error>({
    // Same key as `<PlayerSearch>`'s suggested query so the fetch is shared.
    // `locale` is in the key so the Arabic + Latin variants cache separately
    // (TASK-1606 follow-up).
    queryKey: ["suggestedPlayers", season ?? "current", locale],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (season !== undefined) params.set("season", String(season));
      params.set("locale", locale);
      const res = await fetch(`/api/players/suggested?${params.toString()}`);
      if (!res.ok) throw new Error(`suggested_failed:${res.status}`);
      return (await res.json()) as SuggestedPlayers;
    },
    staleTime: 60_000,
  });

  // Don't re-offer a player already occupying a slot.
  const taken = new Set([slotA, slotB].filter((id): id is number => id != null));
  const cards = dedupe(data)
    .filter((p) => !taken.has(p.id))
    .slice(0, MAX_CARDS);

  if (cards.length === 0) return null;

  const fill = (player: SuggestedPlayer) => {
    // Wrapped in a native View Transition (TASK-910) so the card morphs into the
    // slot instead of snapping. Returns the nuqs setter promise so the API
    // awaits the re-render before the "after" snapshot. Instant fallback +
    // reduced-motion handled inside runViewTransition.
    runViewTransition(() => {
      if (slotA == null) return setSlot("A", player.id);
      if (slotB == null) return setSlot("B", player.id);
      return undefined;
    });
  };

  return (
    <section aria-label={t("suggestedPlayers")} className={cn("space-y-3", className)}>
      <h2 className="text-muted-foreground text-sm font-medium">{t("suggestedPlayers")}</h2>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {/* The reveal rides the <li>, NOT the button — the button carries the
            TASK-910 view-transition-name morph and must stay animation-free. */}
        {cards.map((player, i) => (
          <li key={player.id} {...revealProps(i)}>
            <button
              type="button"
              onClick={() => fill(player)}
              aria-label={t("addToComparison", { name: player.name })}
              className="focus-visible:ring-ring block min-h-11 w-full rounded-md text-start focus-visible:ring-2 focus-visible:outline-none"
              // Shared morph target with the populated slot card (TASK-910):
              // the same name in the before (grid) + after (slot) snapshots lets
              // the browser glide this card into the slot it fills.
              style={{ viewTransitionName: `player-card-${player.id}` }}
            >
              <Card className="ix-glow h-full items-center gap-2 p-3 text-center">
                <PlayerImage player={player} size="md" className="size-12 rounded-full" />
                <p className="w-full truncate text-sm font-medium" title={player.name}>
                  {player.name}
                </p>
                <p className="text-muted-foreground w-full truncate text-xs">{player.team.name}</p>
                {(player.goals != null || player.assists != null) && (
                  <div className="flex flex-wrap justify-center gap-1">
                    {player.goals != null && (
                      <Badge variant="secondary" className="tabular-nums">
                        ⚽ {localizeDigits(player.goals, locale)}
                      </Badge>
                    )}
                    {player.assists != null && (
                      <Badge variant="secondary" className="tabular-nums">
                        🎯 {localizeDigits(player.assists, locale)}
                      </Badge>
                    )}
                  </div>
                )}
              </Card>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
