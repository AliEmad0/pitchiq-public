import type { Era } from "@/utils/era";

// Managers-index OG card (TASK-M53): a "sticker pack" — three fanned collectible
// cards (top managers by points), themed by era. Rendered by
// `src/app/api/og/managers/route.tsx`.
//
// Satori notes: each card is an absolutely-positioned div with `transform:
// rotate()`; the headshot is an <img> inside an overflow-hidden round div (so it
// crops to a circle); a manager with no resolvable photo falls back to initials.

export type ManagerCard = {
  name: string;
  initials: string;
  photoUrl: string | null;
  clubColor: string;
  ppg: string;
};

export type ManagersCardContent = {
  era: Era;
  seasonLabel: string;
  managers: ManagerCard[];
};

type Palette = {
  pageBg: string;
  card: string;
  cardStroke: string;
  name: string;
  sub: string;
  title: string;
  accent: string;
  font: string | undefined;
};

function palette(era: Era): Palette {
  if (era === "retro90s")
    return {
      pageBg: "#e9e0cb",
      card: "#f3ecd9",
      cardStroke: "#cabfa3",
      name: "#241f16",
      sub: "rgba(36,31,22,0.6)",
      title: "#241f16",
      accent: "#8f2b25",
      font: "Oswald",
    };
  if (era === "goldenMillennium")
    return {
      pageBg: "#0b1422",
      card: "#0e1a2c",
      cardStroke: "#1d3450",
      name: "#eaf2fb",
      sub: "rgba(234,242,251,0.6)",
      title: "#eaf2fb",
      accent: "#2fd4ec",
      font: "Rajdhani",
    };
  return {
    pageBg: "#0c0a14",
    card: "#1b1826",
    cardStroke: "#2a2536",
    name: "#ffffff",
    sub: "rgba(255,255,255,0.6)",
    title: "#ffffff",
    accent: "#e22fd0",
    font: undefined,
  };
}

/** Relative OG image path for the managers index at a given season. */
export function managersOgImagePath(season: number): string {
  return `/api/og/managers?season=${season}`;
}

const FAN = [
  { cx: 450, cy: 372, rot: -14 },
  { cx: 640, cy: 350, rot: -2 },
  { cx: 830, cy: 372, rot: 10 },
] as const;

function card(m: ManagerCard, slot: (typeof FAN)[number], p: Palette) {
  const { cx, cy } = slot;
  return (
    <div
      key={m.name + slot.rot}
      style={{
        position: "absolute",
        left: cx - 110,
        top: cy - 150,
        width: 220,
        height: 300,
        transform: `rotate(${slot.rot}deg)`,
        transformOrigin: "center",
        borderRadius: 16,
        backgroundColor: p.card,
        border: `2px solid ${p.cardStroke}`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          height: 14,
          borderTopLeftRadius: 14,
          borderTopRightRadius: 14,
          backgroundColor: m.clubColor,
          display: "flex",
        }}
      />
      <div
        style={{
          marginTop: 34,
          width: 110,
          height: 110,
          borderRadius: 55,
          border: `3px solid ${m.clubColor}`,
          backgroundColor: "#23202e",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {m.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={m.photoUrl} width={110} height={110} alt="" style={{ objectFit: "cover" }} />
        ) : (
          <div style={{ fontSize: 40, fontWeight: 700, color: "#ffffff", display: "flex" }}>
            {m.initials}
          </div>
        )}
      </div>
      <div
        style={{
          marginTop: 26,
          fontSize: 30,
          fontWeight: 700,
          color: p.name,
          display: "flex",
        }}
      >
        {m.name}
      </div>
      <div style={{ marginTop: 10, fontSize: 22, color: p.sub, display: "flex" }}>{m.ppg} PPG</div>
    </div>
  );
}

/** Build the 1200×630 managers sticker-pack element for `ImageResponse`. */
export function renderManagersCard(c: ManagersCardContent) {
  const p = palette(c.era);
  return (
    <div
      style={{
        width: 1200,
        height: 630,
        display: "flex",
        position: "relative",
        backgroundColor: p.pageBg,
        fontFamily: p.font ?? "sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 80,
          top: 96,
          fontSize: 76,
          fontWeight: 800,
          color: p.title,
          display: "flex",
        }}
      >
        Managers
      </div>
      <div
        style={{
          position: "absolute",
          left: 82,
          top: 188,
          fontSize: 26,
          color: p.sub,
          display: "flex",
        }}
      >
        Collect the gaffers · {c.seasonLabel}
      </div>
      <div
        style={{
          position: "absolute",
          left: 80,
          top: 540,
          fontSize: 30,
          fontWeight: 700,
          display: "flex",
        }}
      >
        <span style={{ color: p.title }}>Pitch</span>
        <span style={{ color: p.accent }}>IQ</span>
      </div>

      {c.managers.slice(0, FAN.length).map((m, i) => card(m, FAN[i], p))}
    </div>
  );
}
