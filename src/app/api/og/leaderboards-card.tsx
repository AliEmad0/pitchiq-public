import type { Era } from "@/utils/era";

// Leaderboards-index OG card (TASK-M53): a "stat heat grid" — one tinted tile
// per stat category, each showing that category's season leader. The tiles
// cool from a hot accent fill (first tile) down through deepening shades, so
// the grid reads as a heatmap. Themed by era. Rendered by
// `src/app/api/og/leaderboards/route.tsx`.

export type LeaderboardTile = {
  /** Short category label, e.g. "GOALS", "CLEAN SHEETS". */
  label: string;
  /** Leader surname. */
  leader: string;
  /** Pre-formatted value, e.g. "27", "24.1". */
  value: string;
};

export type LeaderboardsCardContent = {
  era: Era;
  seasonLabel: string;
  tiles: LeaderboardTile[];
};

type Header = {
  pageBg: string;
  title: string;
  label: string;
  sub: string;
  font: string | undefined;
};

type TileStyle = { bg: string; strong: string; soft: string; label: string };

function header(era: Era): Header {
  if (era === "retro90s")
    return {
      pageBg: "#e9e0cb",
      title: "#241f16",
      label: "#8f2b25",
      sub: "rgba(36,31,22,0.7)",
      font: "Oswald",
    };
  if (era === "goldenMillennium")
    return {
      pageBg: "#0b1422",
      title: "#eaf2fb",
      label: "#2fd4ec",
      sub: "rgba(234,242,251,0.72)",
      font: "Rajdhani",
    };
  return {
    pageBg: "#0c0a14",
    title: "#ffffff",
    label: "#e22fd0",
    sub: "rgba(255,255,255,0.72)",
    font: undefined,
  };
}

// Per-era heat ramp (hot → cool). Up to 8 stops — modern (2017+) fills all 8,
// golden ≤7, retro ≤5. Text color flips per stop so it stays legible on the
// tint (Satori has no contrast checker — verified by rendering each era).
const RAMPS: Record<Era, TileStyle[]> = {
  modern: [
    { bg: "#e22fd0", strong: "#1a0518", soft: "#4a0c40", label: "rgba(26,5,24,0.7)" },
    { bg: "#a8228f", strong: "#ffffff", soft: "#ffd9f4", label: "rgba(255,255,255,0.6)" },
    { bg: "#861c72", strong: "#ffffff", soft: "#fcd0ef", label: "rgba(255,255,255,0.55)" },
    { bg: "#6b1759", strong: "#ffffff", soft: "#f3bfe6", label: "rgba(255,255,255,0.5)" },
    { bg: "#551247", strong: "#ffffff", soft: "#eeb2de", label: "rgba(255,255,255,0.5)" },
    { bg: "#430f38", strong: "#ffffff", soft: "#e8a8d6", label: "rgba(255,255,255,0.45)" },
    { bg: "#360c2d", strong: "#ffffff", soft: "#e2a2cf", label: "rgba(255,255,255,0.45)" },
    { bg: "#2c0a25", strong: "#ffffff", soft: "#dc9dc9", label: "rgba(255,255,255,0.4)" },
  ],
  goldenMillennium: [
    { bg: "#5fe3f5", strong: "#06222a", soft: "#0a3640", label: "rgba(6,34,42,0.68)" },
    { bg: "#2fd4ec", strong: "#06222a", soft: "#0a3a45", label: "rgba(6,34,42,0.62)" },
    { bg: "#1fa6bd", strong: "#04181d", soft: "#062a32", label: "rgba(4,24,29,0.6)" },
    { bg: "#177f90", strong: "#ffffff", soft: "#bdeff9", label: "rgba(255,255,255,0.6)" },
    { bg: "#136573", strong: "#ffffff", soft: "#a9e9f5", label: "rgba(255,255,255,0.55)" },
    { bg: "#0f505b", strong: "#ffffff", soft: "#9fe3f1", label: "rgba(255,255,255,0.5)" },
    { bg: "#0c4049", strong: "#ffffff", soft: "#9be0ef", label: "rgba(255,255,255,0.5)" },
    { bg: "#0a343b", strong: "#ffffff", soft: "#97deee", label: "rgba(255,255,255,0.45)" },
  ],
  retro90s: [
    { bg: "#8f2b25", strong: "#ffffff", soft: "#ffe1d3", label: "rgba(255,255,255,0.78)" },
    { bg: "#a85048", strong: "#ffffff", soft: "#ffe9db", label: "rgba(255,255,255,0.72)" },
    { bg: "#bd7b72", strong: "#2a0f0c", soft: "#3a1713", label: "rgba(42,15,12,0.7)" },
    { bg: "#cda098", strong: "#2a0f0c", soft: "#3a1713", label: "rgba(42,15,12,0.66)" },
    { bg: "#d8b8b0", strong: "#2a0f0c", soft: "#3a1713", label: "rgba(42,15,12,0.62)" },
    { bg: "#dec8c0", strong: "#2a0f0c", soft: "#3a1713", label: "rgba(42,15,12,0.58)" },
    { bg: "#e2d0c8", strong: "#2a0f0c", soft: "#3a1713", label: "rgba(42,15,12,0.55)" },
    { bg: "#e5d6cd", strong: "#2a0f0c", soft: "#3a1713", label: "rgba(42,15,12,0.5)" },
  ],
};

/** Relative OG image path for the leaderboards index at a given season. */
export function leaderboardsOgImagePath(season: number): string {
  return `/api/og/leaderboards?season=${season}`;
}

function tile(t: LeaderboardTile, s: TileStyle, key: number) {
  return (
    <div
      key={key}
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        width: 244,
        height: 150,
        marginRight: 16,
        marginBottom: 16,
        borderRadius: 14,
        backgroundColor: s.bg,
        padding: "18px 22px",
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: 20,
          fontWeight: 700,
          letterSpacing: "1px",
          color: s.label,
        }}
      >
        {t.label}
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{ display: "flex", fontSize: 40, lineHeight: 1, fontWeight: 700, color: s.strong }}
        >
          {t.value}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 8,
            fontSize: 22,
            lineHeight: 1,
            fontWeight: 700,
            color: s.soft,
          }}
        >
          {t.leader}
        </div>
      </div>
    </div>
  );
}

/** Build the 1200×630 leaderboards heat-grid element for `ImageResponse`. */
export function renderLeaderboardsCard(c: LeaderboardsCardContent) {
  const h = header(c.era);
  const ramp = RAMPS[c.era];
  const tiles = c.tiles.slice(0, 8);

  return (
    <div
      style={{
        width: 1200,
        height: 630,
        display: "flex",
        flexDirection: "column",
        backgroundColor: h.pageBg,
        fontFamily: h.font ?? "sans-serif",
        padding: "54px 80px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: "6px",
              color: h.label,
            }}
          >
            PREMIER LEAGUE
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 6,
              fontSize: 78,
              fontWeight: 800,
              color: h.title,
            }}
          >
            Leaderboards
          </div>
          <div style={{ display: "flex", marginTop: 8, fontSize: 26, color: h.sub }}>
            This season&rsquo;s stat leaders
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginTop: 8,
            minWidth: 168,
            height: 56,
            padding: "0 24px",
            borderRadius: 28,
            border: `2px solid ${h.label}`,
            fontSize: 26,
            fontWeight: 700,
            color: h.label,
          }}
        >
          {c.seasonLabel}
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", width: 1040, marginTop: 30 }}>
        {tiles.map((t, i) => tile(t, ramp[i] ?? ramp[ramp.length - 1], i))}
      </div>
    </div>
  );
}
