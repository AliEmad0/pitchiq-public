import type { Era } from "@/utils/era";

// Players-index OG card (TASK-M53): a headshot row of the season's most
// valuable players (goals + assists), themed by era. Rendered by
// `src/app/api/og/players/route.tsx`.

export type PlayersCardPlayer = {
  name: string;
  initials: string;
  photoUrl: string | null;
  clubColor: string;
  ga: number;
};

export type PlayersCardContent = {
  era: Era;
  seasonLabel: string;
  players: PlayersCardPlayer[];
};

type Palette = {
  pageBg: string;
  title: string;
  label: string;
  sub: string;
  font: string | undefined;
};

function palette(era: Era): Palette {
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

/** Relative OG image path for the players index at a given season. */
export function playersOgImagePath(season: number): string {
  return `/api/og/players?season=${season}`;
}

function headshot(p: PlayersCardPlayer, t: Palette) {
  return (
    <div
      key={p.name}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 130 }}
    >
      <div
        style={{
          width: 104,
          height: 104,
          borderRadius: 52,
          border: `3px solid ${p.clubColor}`,
          backgroundColor: "#23202e",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Initials sit behind the photo, so a failed image (Satori has no
            onError) falls through to the monogram instead of a blank circle. */}
        <div style={{ fontSize: 36, fontWeight: 700, color: "#ffffff", display: "flex" }}>
          {p.initials}
        </div>
        {p.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.photoUrl}
            width={104}
            height={104}
            alt=""
            style={{ position: "absolute", top: 0, left: 0, objectFit: "cover" }}
          />
        ) : null}
      </div>
      <div
        style={{ marginTop: 14, fontSize: 24, fontWeight: 700, color: t.title, display: "flex" }}
      >
        {p.name}
      </div>
      <div style={{ marginTop: 4, fontSize: 20, fontWeight: 700, color: t.label, display: "flex" }}>
        {p.ga} G+A
      </div>
    </div>
  );
}

/** Build the 1200×630 players headshot-row element for `ImageResponse`. */
export function renderPlayersCard(c: PlayersCardContent) {
  const t = palette(c.era);
  return (
    <div
      style={{
        width: 1200,
        height: 630,
        display: "flex",
        position: "relative",
        backgroundColor: t.pageBg,
        fontFamily: t.font ?? "sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 80,
          top: 122,
          fontSize: 30,
          fontWeight: 700,
          letterSpacing: "6px",
          color: t.label,
          display: "flex",
        }}
      >
        PREMIER LEAGUE
      </div>
      <div
        style={{
          position: "absolute",
          left: 74,
          top: 168,
          fontSize: 120,
          fontWeight: 800,
          color: t.title,
          display: "flex",
        }}
      >
        Players
      </div>
      <div
        style={{
          position: "absolute",
          left: 80,
          top: 320,
          fontSize: 26,
          color: t.sub,
          display: "flex",
        }}
      >
        The most valuable — goals + assists
      </div>

      <div
        style={{
          position: "absolute",
          left: 950,
          top: 96,
          width: 170,
          height: 56,
          borderRadius: 28,
          border: `2px solid ${t.label}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 26,
          fontWeight: 700,
          color: t.label,
        }}
      >
        {c.seasonLabel}
      </div>

      <div
        style={{
          position: "absolute",
          left: 80,
          top: 420,
          width: 1040,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        {c.players.slice(0, 7).map((p) => headshot(p, t))}
      </div>
    </div>
  );
}
