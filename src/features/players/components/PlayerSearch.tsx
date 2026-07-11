"use client";

import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { PlayerImage } from "@/features/players/components/PlayerImage";
import { cn } from "@/utils/cn";
import { dedupeById } from "@/utils/dedupe";
import { highlightMatch } from "@/utils/highlight";
import type { PlayerSearchHit, SuggestedPlayers } from "@/features/players/api";

export type PlayerSearchProps = {
  // Fired when the user picks a player from the dropdown. The slot pickers
  // (TASK-405) write the picked id into URL state via
  // `useComparisonSelection().setSlot(slot, hit.id)`.
  onSelect: (hit: PlayerSearchHit) => void;
  // Defaults to "Search players…". Slot picker labels can override
  // ("Pick player A", "Pick player B").
  placeholder?: string;
  // Optional season override; falls back to the current year on the server
  // side of the Route Handler. Used for the season-scoped search + the
  // focus-state suggestions (current-season top scorers/assists).
  season?: number;
  // When true, the typed search queries the CROSS-SEASON index (`/api/search`,
  // TASK-M11) instead of the season-scoped `/api/players/search`, so a player
  // from any era (e.g. Henry, Ronaldo) is findable regardless of the active
  // season. Hits carry `season` (their latest) so the compare slot can default
  // to a season they actually played. The compare slot pickers set this.
  crossSeason?: boolean;
  // Optional class on the root Command for layout inside a slot picker.
  className?: string;
};

// Minimum chars before we round-trip to the API. Mirrors the route's
// own `MIN_QUERY_LENGTH = 3` gate — duplicating client-side saves the
// API call entirely below the threshold.
const MIN_QUERY_LENGTH = 3;

// Debounce window for the type-ahead. 300 ms is the spec's value; it's
// the sweet spot where typing-fast users don't feel laggy and quota
// stays intact. The route is also rate-limited at the the wire
// upstream, so over-firing here would compound the quota burn.
const DEBOUNCE_MS = 300;

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(handle);
  }, [value, delayMs]);
  return debounced;
}

// Reusable type-ahead combobox over `/api/players/search`. Two slot
// pickers (TASK-405) reuse this with their own `onSelect`; the input
// state lives entirely inside the component so neither picker has to
// prop-drill the query string. Built on Shadcn `Command` (the spec also
// lists Popover, but the dropdown is a positioned `CommandList` inline
// under the input — simpler, no portal, easier to test without the
// happy-dom + Radix portal awkwardness that bit `<SeasonSwitcher>`.
// Anchored positioning via `absolute` + `z-50` floats over content
// without shifting layout, which is what Popover would have done).
export function PlayerSearch({
  onSelect,
  placeholder,
  season,
  crossSeason = false,
  className,
}: PlayerSearchProps) {
  const t = useTranslations("compare");
  const ts = useTranslations("search");
  const locale = useLocale();
  const ph = placeholder ?? t("searchPlayers");
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const debounced = useDebouncedValue(query, DEBOUNCE_MS);
  const trimmed = debounced.trim();
  const enabled = trimmed.length >= MIN_QUERY_LENGTH;

  const { data, isFetching, isError } = useQuery<PlayerSearchHit[], Error>({
    // `locale` in the key so hits localize on `/ar` and cache separately
    // (TASK-1606 follow-up).
    queryKey: ["playerSearch", trimmed, crossSeason ? "all" : (season ?? "current"), locale],
    queryFn: async () => {
      if (crossSeason) {
        // Cross-season: the committed search index (one entry per player, the
        // latest season they appear in) so historical players are findable.
        // `?locale=` → the index's baked `nameAr` renders on `/ar`.
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(trimmed)}&locale=${encodeURIComponent(locale)}`,
        );
        if (!res.ok) {
          throw new Error(`search_failed:${res.status}`);
        }
        const json = (await res.json()) as { players: PlayerSearchHit[] };
        return json.players;
      }
      const params = new URLSearchParams({ q: trimmed, locale });
      if (season !== undefined) params.set("season", String(season));
      const res = await fetch(`/api/players/search?${params.toString()}`);
      if (!res.ok) {
        // 502 from the route means upstream failure; render an explicit
        // error state below rather than letting TanStack swallow the
        // response into a blank dropdown.
        throw new Error(`search_failed:${res.status}`);
      }
      return (await res.json()) as PlayerSearchHit[];
    },
    enabled,
    // Quoted from TASK-404's spec — keeps repeated queries cheap. Lines
    // up with the route's `revalidate: 0 + tag` contract: the route
    // emits no Next cache header, so freshness is owned by this 60s
    // staleTime instead.
    staleTime: 60_000,
  });

  // Two dropdown modes. Search (>= 3 chars) is unchanged and not gated on
  // focus. Suggested mode shows on focus while the query is below the search
  // threshold — the empty-box default — so the picker offers top scorers +
  // assists instead of a blank dropdown (TASK-604).
  const showSearch = enabled;
  const showSuggested = focused && trimmed.length < MIN_QUERY_LENGTH;
  const showDropdown = showSearch || showSuggested;

  const { data: suggested, isFetching: suggestedFetching } = useQuery<SuggestedPlayers, Error>({
    // Same key shape as `<SuggestedPlayerGrid>` (incl. `locale`) so the fetch
    // is shared and locale-correct (TASK-1606 follow-up).
    queryKey: ["suggestedPlayers", season ?? "current", locale],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (season !== undefined) params.set("season", String(season));
      params.set("locale", locale);
      const res = await fetch(`/api/players/suggested?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`suggested_failed:${res.status}`);
      }
      return (await res.json()) as SuggestedPlayers;
    },
    enabled: showSuggested,
    staleTime: 60_000,
  });

  // TASK-M11: one flat, deduped suggestion list (scorers first) instead of two
  // labelled sections — so a player who leads both shows once.
  const suggestedFlat = suggested
    ? dedupeById([...(suggested.topScorers ?? []), ...(suggested.topAssists ?? [])])
    : [];

  // Search and suggested rows are identical; the key/value prefix keeps cmdk
  // values unique when the same player appears in both suggestion sections
  // (e.g. a top scorer who's also a top assister).
  const renderHit = (hit: PlayerSearchHit, keyPrefix: string) => (
    <CommandItem
      key={`${keyPrefix}-${hit.id}`}
      value={`${keyPrefix}-${hit.id}-${hit.name}`}
      onSelect={() => onSelect(hit)}
    >
      <PlayerImage player={hit} size="sm" className="size-7 rounded-full" />
      {/* aria-label pins the accessible name to the full name — the split
          highlight segments would otherwise have the accname algorithm join
          them with spaces (presentational-only, but breaks name lookups). */}
      <span className="flex-1 truncate" aria-label={hit.name}>
        {/* TASK-M31: bold the matched characters (only in search mode — the
            suggested list has an empty query so the whole name renders plain). */}
        {highlightMatch(hit.name, trimmed).map((seg, i) =>
          seg.match ? (
            <span key={i} className="text-primary bg-primary/15 rounded-[3px] font-semibold">
              {seg.text}
            </span>
          ) : (
            <span key={i}>{seg.text}</span>
          ),
        )}
      </span>
      <span className="text-muted-foreground ms-2 truncate text-xs">{hit.team.name}</span>
    </CommandItem>
  );

  return (
    <Command shouldFilter={false} className={cn("relative overflow-visible", className)}>
      <CommandInput
        placeholder={ph}
        value={query}
        onValueChange={setQuery}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {showDropdown && (
        <CommandList
          // Anchored under the input. `bg-popover` matches the Shadcn
          // dropdown convention so dark-mode styling carries. `onMouseDown`
          // preventDefault keeps the input focused while a suggestion is
          // clicked, so the input's blur doesn't tear down the dropdown
          // before cmdk's `onSelect` fires.
          onMouseDown={(e) => e.preventDefault()}
          className="ix-pop bg-popover absolute inset-x-0 top-full z-50 mt-1 rounded-md border shadow-md"
        >
          {showSearch ? (
            <>
              {isFetching && !data && (
                <p role="status" className="text-muted-foreground px-3 py-6 text-center text-sm">
                  {ts("searching")}
                </p>
              )}
              {!isFetching && isError && (
                <p role="alert" className="text-muted-foreground px-3 py-6 text-center text-sm">
                  {ts("unavailable")}
                </p>
              )}
              {!isFetching && !isError && data && data.length === 0 && (
                <CommandEmpty>{t("noPlayersFound")}</CommandEmpty>
              )}
              {data && data.length > 0 && data.map((hit) => renderHit(hit, "search"))}
            </>
          ) : (
            <>
              {suggestedFetching && !suggested && (
                <p role="status" className="text-muted-foreground px-3 py-6 text-center text-sm">
                  {t("loadingSuggestions")}
                </p>
              )}
              {/* TASK-M11: merge top scorers + assists into ONE flat, deduped
                  list (a dual-leader like Salah no longer shows twice) and drop
                  the section sub-headers — aligns with the suggested-card grid. */}
              {suggestedFlat.length > 0 && (
                <CommandGroup>{suggestedFlat.map((hit) => renderHit(hit, "suggest"))}</CommandGroup>
              )}
            </>
          )}
        </CommandList>
      )}
    </Command>
  );
}
