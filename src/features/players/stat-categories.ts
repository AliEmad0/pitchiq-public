import type { ComparisonMetrics, ExtendedMetrics } from "@/types/api";

// TASK-M65 — the 10-category grouping that drives the Category Accordion on
// `/players/[id]`. Every field the profile can show (the flat core + the nested
// `metrics.extended` bag, 66 stats) belongs to exactly one category here.
//
// `labelKey` is the message key in the `metrics` namespace (shared with /compare
// so a stat reads identically everywhere); `label` is the English fallback used
// by tests + non-localized surfaces. `ext` marks a field that lives under
// `metrics.extended` (present only for SDP-covered historical seasons); a core
// field with no `ext` reads straight off `metrics`. `fmt` picks the formatter —
// `pct` (1dp + "%"), `dec` (1dp, for xG/xA floats), default is an integer.
//
// A category renders only when ≥1 of its fields has a non-null value, and within
// it only the non-null fields show — so a modern season (core only) collapses to
// its populated categories and a 2003-16 season fills all ten.

export type StatFormat = "int" | "pct" | "dec";

export interface StatDef {
  key: keyof ComparisonMetrics | keyof ExtendedMetrics;
  label: string;
  labelKey: string;
  ext?: true;
  fmt?: StatFormat;
}

export interface StatCategory {
  key: string;
  /** English fallback for the category header. */
  title: string;
  /** `metrics` namespace key for the localized category header. */
  titleKey: string;
  /** Accent hue (dot / chevron / colour-wash), tuned to read on both themes. */
  accent: string;
  stats: StatDef[];
}

const core = (key: StatDef["key"], label: string, fmt?: StatFormat): StatDef => ({
  key,
  label,
  labelKey: key as string,
  fmt,
});
const ext = (key: keyof ExtendedMetrics, label: string, labelKey: string): StatDef => ({
  key,
  label,
  labelKey,
  ext: true,
});

export const STAT_CATEGORIES: StatCategory[] = [
  {
    key: "playingTime",
    title: "Playing time",
    titleKey: "catPlayingTime",
    accent: "#6366f1",
    stats: [
      core("appearances", "Appearances"),
      ext("starts", "Starts", "starts"),
      ext("minutesPlayed", "Minutes", "minutesPlayed"),
      ext("gamesPlayed", "Games played", "gamesPlayed"),
      ext("substituteOn", "Came on as sub", "substituteOn"),
      ext("substituteOff", "Subbed off", "substituteOff"),
    ],
  },
  {
    key: "shooting",
    title: "Shooting",
    titleKey: "catShooting",
    accent: "#e0891b",
    stats: [
      core("goals", "Goals"),
      core("xg", "Expected goals (xG)", "dec"),
      core("shotsOnTarget", "Shots on target"),
      ext("totalShots", "Total shots", "totalShots"),
      ext("shotsOffTarget", "Shots off target", "shotsOffTarget"),
      ext("blockedShots", "Blocked shots", "blockedShots"),
      ext("headedGoals", "Headed goals", "headedGoals"),
      ext("leftFootGoals", "Left-foot goals", "leftFootGoals"),
      ext("homeGoals", "Home goals", "homeGoals"),
      ext("awayGoals", "Away goals", "awayGoals"),
      ext("winningGoals", "Winning goals", "winningGoals"),
      ext("offsides", "Offsides", "offsides"),
      ext("setPieceAttempts", "Set-piece attempts", "setPieceAttempts"),
    ],
  },
  {
    key: "creation",
    title: "Creation",
    titleKey: "catCreation",
    accent: "#d1662f",
    stats: [
      core("assists", "Assists"),
      core("xa", "Expected assists (xA)", "dec"),
      core("keyPasses", "Key passes"),
    ],
  },
  {
    key: "passing",
    title: "Passing",
    titleKey: "catPassing",
    accent: "#2f7fd1",
    stats: [
      core("passAccuracy", "Pass accuracy", "pct"),
      ext("totalPasses", "Total passes", "totalPasses"),
      ext("openPlayPasses", "Open-play passes", "openPlayPasses"),
      ext("touches", "Touches", "touches"),
      ext("successfulShortPasses", "Short passes completed", "successfulShortPasses"),
      ext("unsuccessfulShortPasses", "Short passes failed", "unsuccessfulShortPasses"),
      ext("successfulLongPasses", "Long passes completed", "successfulLongPasses"),
      ext("unsuccessfulLongPasses", "Long passes failed", "unsuccessfulLongPasses"),
      ext("successfulPassesOwnHalf", "Own-half completed", "successfulPassesOwnHalf"),
      ext("unsuccessfulPassesOwnHalf", "Own-half failed", "unsuccessfulPassesOwnHalf"),
      ext("successfulPassesOppositionHalf", "Opp-half completed", "successfulPassesOppositionHalf"),
      ext("unsuccessfulPasses", "Passes failed", "unsuccessfulPasses"),
      ext("possessionLost", "Possession lost", "possessionLost"),
      ext("throwIns", "Throw-ins", "throwIns"),
    ],
  },
  {
    key: "crossing",
    title: "Crossing & corners",
    titleKey: "catCrossing",
    accent: "#8a6fc0",
    stats: [
      ext("successfulCrossesOpenPlay", "Open-play crosses", "successfulCrossesOpenPlay"),
      ext("unsuccessfulCrossesOpenPlay", "Open-play crosses failed", "unsuccessfulCrossesOpenPlay"),
      ext("successfulCrossesAndCorners", "Crosses & corners", "successfulCrossesAndCorners"),
      ext(
        "unsuccessfulCrossesAndCorners",
        "Crosses & corners failed",
        "unsuccessfulCrossesAndCorners",
      ),
      ext("cornersTaken", "Corners taken", "cornersTaken"),
      ext("cornersWon", "Corners won", "cornersWon"),
    ],
  },
  {
    key: "dribbling",
    title: "Dribbling",
    titleKey: "catDribbling",
    accent: "#1f9d78",
    stats: [
      core("dribblesCompleted", "Dribbles completed"),
      ext("unsuccessfulDribbles", "Dribbles failed", "unsuccessfulDribbles"),
      ext("timesDispossessed", "Times dispossessed", "timesDispossessed"),
    ],
  },
  {
    key: "duels",
    title: "Duels",
    titleKey: "catDuels",
    accent: "#b07a4f",
    stats: [
      core("duelsWon", "Duels won"),
      ext("duels", "Total duels", "duels"),
      ext("duelsLost", "Duels lost", "duelsLost"),
      ext("groundDuels", "Ground duels", "groundDuels"),
      ext("groundDuelsWon", "Ground duels won", "groundDuelsWon"),
      ext("groundDuelsLost", "Ground duels lost", "groundDuelsLost"),
    ],
  },
  {
    key: "defending",
    title: "Defending",
    titleKey: "catDefending",
    accent: "#3f9d6a",
    stats: [
      core("tackles", "Tackles"),
      ext("tacklesWon", "Tackles won", "tacklesWon"),
      ext("tacklesLost", "Tackles lost", "tacklesLost"),
      core("interceptions", "Interceptions"),
      ext("clearances", "Clearances", "clearances"),
      ext("blocks", "Blocks", "blocks"),
      ext("foulsWon", "Fouls won", "foulsWon"),
    ],
  },
  {
    key: "discipline",
    title: "Discipline",
    titleKey: "catDiscipline",
    accent: "#d05650",
    stats: [
      core("yellowCards", "Yellow cards"),
      core("redCards", "Red cards"),
      ext("straightRedCards", "Straight reds", "straightRedCards"),
      ext("foulsConceded", "Fouls conceded", "foulsConceded"),
      ext("penaltiesConceded", "Penalties conceded", "penaltiesConceded"),
      ext("handballsConceded", "Handballs conceded", "handballsConceded"),
    ],
  },
  {
    key: "goalsAgainst",
    title: "Goals against / GK",
    titleKey: "catGoalsAgainst",
    accent: "#2f9fb8",
    stats: [
      core("cleanSheets", "Clean sheets"),
      core("saves", "Saves"),
      ext("goalsConceded", "Goals conceded", "goalsConceded"),
      ext("goalsConcededInsideBox", "Conceded inside box", "goalsConcededInsideBox"),
      ext("goalsConcededOutsideBox", "Conceded outside box", "goalsConcededOutsideBox"),
      ext("penaltyGoalsConceded", "Penalty goals conceded", "penaltyGoalsConceded"),
    ],
  },
];

/** Resolve a stat's value off the metrics object (core field or nested extended bag). */
export function statValue(metrics: ComparisonMetrics, def: StatDef): number | null {
  const raw = def.ext
    ? (metrics.extended?.[def.key as keyof ExtendedMetrics] ?? null)
    : (metrics[def.key as keyof ComparisonMetrics] as number | null | undefined);
  return raw ?? null;
}

/** Categories that have at least one populated stat, each trimmed to its non-null fields. */
export function populatedCategories(
  metrics: ComparisonMetrics,
): Array<{ category: StatCategory; stats: Array<{ def: StatDef; value: number }> }> {
  return STAT_CATEGORIES.map((category) => ({
    category,
    stats: category.stats
      .map((def) => ({ def, value: statValue(metrics, def) }))
      .filter((s): s is { def: StatDef; value: number } => s.value !== null),
  })).filter((c) => c.stats.length > 0);
}
