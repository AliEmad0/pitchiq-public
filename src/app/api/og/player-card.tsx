import type { Era } from "@/utils/era";

// Player-profile OG card (TASK-M53): a magazine cover — masthead, the player's
// name, a hero portrait, and cover lines. Themed by era. Rendered by
// `src/app/api/og/player/route.tsx`.

export type PlayerCardContent = {
  era: Era;
  firstName: string;
  lastName: string;
  initials: string;
  photoUrl: string | null;
  clubColor: string;
  position: string;
  clubName: string;
  goals: number;
  assists: number;
  seasonLabel: string;
};

type Palette = {
  pageBg: string;
  title: string;
  accent: string;
  gold: string;
  sub: string;
  font: string | undefined;
};

function palette(era: Era): Palette {
  if (era === "retro90s")
    return {
      pageBg: "#e9e0cb",
      title: "#241f16",
      accent: "#8f2b25",
      gold: "#8f2b25",
      sub: "rgba(36,31,22,0.72)",
      font: "Oswald",
    };
  if (era === "goldenMillennium")
    return {
      pageBg: "#0b1422",
      title: "#eaf2fb",
      accent: "#2fd4ec",
      gold: "#f4c84a",
      sub: "rgba(234,242,251,0.72)",
      font: "Rajdhani",
    };
  return {
    pageBg: "#0c0a14",
    title: "#ffffff",
    accent: "#e22fd0",
    gold: "#f4c84a",
    sub: "rgba(255,255,255,0.72)",
    font: undefined,
  };
}

const BARS = [6, 3, 3, 6, 3, 6, 3, 6, 3, 3, 6, 3, 6, 3];

/** Relative OG image path for a player profile at a given season. */
export function playerOgImagePath(id: number | string, season: number): string {
  return `/api/og/player?id=${id}&season=${season}`;
}

/** Build the 1200×630 player magazine-cover element for `ImageResponse`. */
export function renderPlayerCard(c: PlayerCardContent) {
  const t = palette(c.era);
  const coverLines = [
    `${c.goals} goals · ${c.assists} assists`,
    `${c.position} · ${c.clubName}`,
    `Season ${c.seasonLabel}`,
  ];

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
      {/* Hero portrait (right) */}
      <div
        style={{
          position: "absolute",
          left: 660,
          top: 150,
          width: 320,
          height: 320,
          borderRadius: 160,
          border: `4px solid ${c.clubColor}`,
          backgroundColor: "#23202e",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {/* Initials behind the photo → graceful fallback if the image 404s
            (the container is already position:absolute → contains the img). */}
        <div style={{ fontSize: 110, fontWeight: 700, color: "#ffffff", display: "flex" }}>
          {c.initials}
        </div>
        {c.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={c.photoUrl}
            width={320}
            height={320}
            alt=""
            style={{ position: "absolute", top: 0, left: 0, objectFit: "cover" }}
          />
        ) : null}
      </div>

      {/* Masthead */}
      <div
        style={{
          position: "absolute",
          left: 80,
          top: 86,
          fontSize: 60,
          fontWeight: 800,
          letterSpacing: "-1px",
          display: "flex",
        }}
      >
        <span style={{ color: t.title }}>Pitch</span>
        <span style={{ color: t.accent }}>IQ</span>
      </div>

      {/* Name */}
      <div
        style={{
          position: "absolute",
          left: 80,
          top: 178,
          fontSize: 78,
          fontWeight: 800,
          color: t.title,
          display: "flex",
        }}
      >
        {c.firstName.toUpperCase()}
      </div>
      <div
        style={{
          position: "absolute",
          left: 80,
          top: 262,
          fontSize: 78,
          fontWeight: 800,
          color: t.accent,
          display: "flex",
        }}
      >
        {c.lastName.toUpperCase()}
      </div>

      {/* Cover lines — bullet is a drawn triangle (avoids a missing ▸ glyph) */}
      <div
        style={{
          position: "absolute",
          left: 82,
          top: 380,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {coverLines.map((line, i) => (
          <div
            key={line}
            style={{ display: "flex", alignItems: "center", marginTop: i === 0 ? 0 : 16 }}
          >
            <div
              style={{
                width: 13,
                height: 16,
                marginRight: 12,
                backgroundColor: i === 0 ? t.gold : t.accent,
                clipPath: "polygon(0 0, 100% 50%, 0 100%)",
                display: "flex",
              }}
            />
            <div
              style={{
                fontSize: 27,
                fontWeight: 700,
                color: i === 0 ? t.gold : t.title,
                display: "flex",
              }}
            >
              {line}
            </div>
          </div>
        ))}
      </div>

      {/* Faux barcode */}
      <div
        style={{
          position: "absolute",
          left: 82,
          top: 530,
          display: "flex",
          alignItems: "flex-end",
        }}
      >
        {BARS.map((w, i) => (
          <div
            key={i}
            style={{
              width: w,
              height: 44,
              marginLeft: i === 0 ? 0 : 4,
              backgroundColor: t.title,
              display: "flex",
            }}
          />
        ))}
        <div
          style={{ marginLeft: 14, fontSize: 20, fontWeight: 700, color: t.sub, display: "flex" }}
        >
          THE {c.position.toUpperCase()} ISSUE
        </div>
      </div>
    </div>
  );
}
