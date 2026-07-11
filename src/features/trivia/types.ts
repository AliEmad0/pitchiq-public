import type {
  Standing,
  Player,
  Fixture,
  Leaderboards,
  GoalAttribution,
  ManagersFile,
  FixtureExtrasFile,
} from "@/data/schemas";

/**
 * Trivia engine types (TASK-1101).
 *
 * The engine surfaces only **provably-true** facts computed live from the
 * committed data — never imported knowledge. Each rule is a pure async function
 * over a `TriviaData` facade (so tests inject synthetic fixtures and production
 * passes a loader-backed adapter), and ships a `verify` closure that re-derives
 * its claim from the data before the fact is exposed.
 */

export type TriviaScope = "league" | "team" | "player";

/** What the caller is asking about: the whole league, one team, or one player. */
export type TriviaCtx = {
  scope: TriviaScope;
  /** team id (team scope) or player id (player scope); omitted for league scope. */
  id?: number;
};

/**
 * Read facade the rules consume — mirrors `src/data/loaders.ts` but injectable.
 * `season` is the focus season; every accessor defaults to it and accepts an
 * explicit season for cross-season rules.
 */
export interface TriviaData {
  season: number;
  standings(season?: number): Promise<Standing[] | null>;
  players(season?: number): Promise<Player[] | null>;
  fixtures(season?: number): Promise<Fixture[] | null>;
  leaderboards(season?: number): Promise<Leaderboards | null>;
  /** Every committed season, newest-first. */
  seasons(): Promise<number[]>;
  /** TASK-M26: committed per-player goal-attribution map (season-independent). */
  goalAttribution(): Promise<GoalAttribution | null>;
  /** TASK-M26 2b: committed managers map (season → teamId → managers), all seasons. */
  managers(): Promise<ManagersFile | null>;
  /** TASK-M26 2c: per-season committed fixture-extras map (attendance + venue). */
  fixtureExtras(season?: number): Promise<FixtureExtrasFile | null>;
}

/** Provenance — which committed records a fact was derived from. */
export type TriviaSource =
  | { kind: "standings"; season: number; teamId?: number }
  | { kind: "leaderboard"; season: number; metric: string }
  | { kind: "fixtures"; season: number; fixtureId?: string }
  | { kind: "players"; season: number; playerId?: number }
  | { kind: "events"; season?: number };

/**
 * ICU interpolation values for a localized fact. Numbers are locale-formatted by
 * `<TriviaCard>` at render (Eastern-Arabic on `/ar`); strings (entity names —
 * source form per the i18n data policy) pass through. A value keyed exactly
 * `season` is rendered via `formatSeasonLabel`; other numbers ≥ 1000 are grouped.
 */
export type TriviaValues = Record<string, string | number>;

/** A rule's output before the engine stamps it into a `TriviaFact`. */
export type RuleResult = {
  /** English source-form sentence. Always present — the fact id hashes on it,
   *  and it's the `/en` render + the graceful fallback for a not-yet-localized
   *  rule (a fact with no `key` shows this even on `/ar`). */
  text: string;
  /** Message key in the `trivia` namespace (Arabic trivia). When set, the card
   *  renders `t(key, values)` on RTL locales instead of `text`; English always
   *  uses `text`. Omit to fall back to `text` — lets rules localize one batch
   *  at a time. */
  key?: string;
  /** ICU params for `key` (entity names + numbers). */
  values?: TriviaValues;
  sources: TriviaSource[];
  /** Independently re-derive the claim from the data; false → fact is dropped. */
  verify(data: TriviaData): Promise<boolean>;
};

export type TriviaRule = {
  id: string; // "R1".."R10"
  title: string; // short human label
  scopes: TriviaScope[];
  run(data: TriviaData, ctx: TriviaCtx): Promise<RuleResult | null>;
};

export type TriviaFact = {
  id: string; // stable hash of (rule, text) for memoization / React keys
  scope: TriviaScope;
  rule: string; // the rule id that produced it
  text: string;
  key?: string; // `trivia` message key (Arabic trivia); RTL renders this over `text`
  values?: TriviaValues; // ICU params for `key`
  sources: TriviaSource[];
  verifiedAt: string; // ISO timestamp the claim last re-verified
};
