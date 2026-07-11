import type { StatLeaderboardEntry } from "@/features/players/components/StatLeaderboard";
import type { ComparisonMetrics, Player } from "@/data/schemas";

type Accent = "amber" | "blue" | "yellow" | "red";

// `title`/`valueLabel` are the English fallback (used by the OG-card route,
// which stays English/brand). `titleKey`/`valueLabelKey` are message keys in the
// `leaderboard` namespace — the `/leaderboards` page resolves them via `t(...)`
// so the boards are localized (TASK-1603).
export type LeaderboardCategory = {
  key: keyof ComparisonMetrics;
  title: string;
  valueLabel: string;
  titleKey: string;
  valueLabelKey: string;
  accent?: Accent;
  decimals?: number;
  // Restrict the ranked pool to these positions (M21 — Clean Sheets = GK/DEF,
  // since the PL `clean_sheet` metric is credited per-player to every position).
  positions?: Player["position"][];
};

// Display order: attacking → keeping/defending → advanced → discipline.
export const LEADERBOARD_CATEGORIES: readonly LeaderboardCategory[] = [
  { key: "goals", title: "Goals", valueLabel: "Goals", titleKey: "catGoalsTitle", valueLabelKey: "catGoalsValue", accent: "amber" }, // prettier-ignore
  { key: "assists", title: "Assists", valueLabel: "Assists", titleKey: "catAssistsTitle", valueLabelKey: "catAssistsValue", accent: "blue" }, // prettier-ignore
  { key: "appearances", title: "Appearances", valueLabel: "Apps", titleKey: "catAppearancesTitle", valueLabelKey: "catAppearancesValue" }, // prettier-ignore
  {
    key: "cleanSheets",
    title: "Clean Sheets",
    valueLabel: "CS",
    titleKey: "catCleanSheetsTitle",
    valueLabelKey: "catCleanSheetsValue",
    positions: ["Goalkeeper", "Defender"],
  },
  { key: "saves", title: "Saves", valueLabel: "Saves", titleKey: "catSavesTitle", valueLabelKey: "catSavesValue" }, // prettier-ignore
  { key: "keyPasses", title: "Key Passes", valueLabel: "Key passes", titleKey: "catKeyPassesTitle", valueLabelKey: "catKeyPassesValue" }, // prettier-ignore
  { key: "tackles", title: "Tackles", valueLabel: "Tackles", titleKey: "catTacklesTitle", valueLabelKey: "catTacklesValue" }, // prettier-ignore
  { key: "interceptions", title: "Interceptions", valueLabel: "Int", titleKey: "catInterceptionsTitle", valueLabelKey: "catInterceptionsValue" }, // prettier-ignore
  { key: "dribblesCompleted", title: "Dribbles", valueLabel: "Dribbles", titleKey: "catDribblesTitle", valueLabelKey: "catDribblesValue" }, // prettier-ignore
  { key: "shotsOnTarget", title: "Shots on Target", valueLabel: "SoT", titleKey: "catShotsOnTargetTitle", valueLabelKey: "catShotsOnTargetValue" }, // prettier-ignore
  { key: "xg", title: "Expected Goals (xG)", valueLabel: "xG", titleKey: "catXgTitle", valueLabelKey: "catXgValue", decimals: 1 }, // prettier-ignore
  { key: "xa", title: "Expected Assists (xA)", valueLabel: "xA", titleKey: "catXaTitle", valueLabelKey: "catXaValue", decimals: 1 }, // prettier-ignore
  { key: "yellowCards", title: "Yellow Cards", valueLabel: "Yellow", titleKey: "catYellowCardsTitle", valueLabelKey: "catYellowCardsValue", accent: "yellow" }, // prettier-ignore
  { key: "redCards", title: "Red Cards", valueLabel: "Red", titleKey: "catRedCardsTitle", valueLabelKey: "catRedCardsValue", accent: "red" }, // prettier-ignore
];

/**
 * Rank players by a metric. Drops null/≤0 values, sorts desc with a lower-id
 * tiebreak (deterministic, matching the committed leaderboards), takes top-N,
 * and rounds the displayed value when `decimals` is given (sort stays on the
 * raw value). Returns rows in the `<StatLeaderboard>` display shape.
 */
export function rankBy(
  players: Player[],
  key: keyof ComparisonMetrics,
  opts: { n?: number; decimals?: number } = {},
): StatLeaderboardEntry[] {
  const { n = 10, decimals } = opts;
  const scored = players
    .map((p) => ({ p, v: p.metrics[key] }))
    .filter((x): x is { p: Player; v: number } => typeof x.v === "number" && x.v > 0)
    .sort((a, b) => b.v - a.v || a.p.id - b.p.id)
    .slice(0, n);
  return scored.map(({ p, v }, i) => ({
    rank: i + 1,
    name: p.name,
    playerId: p.id,
    team: p.teamName,
    teamId: p.teamId,
    photo: p.photo ?? "",
    value: decimals !== undefined ? Number(v.toFixed(decimals)) : v,
  }));
}

/** Every category with ≥1 ranked row for this player set (empty boards omitted). */
export function buildBoards(
  players: Player[],
): Array<{ cat: LeaderboardCategory; rows: StatLeaderboardEntry[] }> {
  return LEADERBOARD_CATEGORIES.map((cat) => {
    const pool = cat.positions
      ? players.filter((p) => cat.positions!.includes(p.position))
      : players;
    return { cat, rows: rankBy(pool, cat.key, { decimals: cat.decimals }) };
  }).filter((b) => b.rows.length > 0);
}
