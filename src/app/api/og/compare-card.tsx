import type { SlotSeason } from "@/features/players/comparison-metrics";
import type { Era } from "@/utils/era";

// Compare OG card (TASK-M53): a "versus poster" — two surnames set huge
// (player A top-left in the era accent, player B bottom-right in a contrasting
// accent) with a big "VS" between them. Falls back to a generic "Compare"
// poster when fewer than two players resolve. Rendered by
// `src/app/api/og/compare/route.tsx`.

export type CompareSlot = {
  surname: string;
  club: string;
  /** Per-slot season label ("2024-25" or "Career 2003–2018"). */
  label: string;
  goals: number;
  assists: number;
};

export type CompareCardContent = {
  era: Era;
  seasonLabel: string;
  a: CompareSlot | null;
  b: CompareSlot | null;
};

type Palette = {
  bg: string;
  title: string;
  accentA: string;
  accentB: string;
  muted: string;
  font: string | undefined;
};

function palette(era: Era): Palette {
  if (era === "retro90s")
    return {
      bg: "#e9e0cb",
      title: "#241f16",
      accentA: "#8f2b25",
      accentB: "#284a78",
      muted: "rgba(36,31,22,0.66)",
      font: "Oswald",
    };
  if (era === "goldenMillennium")
    return {
      bg: "#0b1422",
      title: "#eaf2fb",
      accentA: "#2fd4ec",
      accentB: "#f4b740",
      muted: "rgba(234,242,251,0.64)",
      font: "Rajdhani",
    };
  return {
    bg: "#0c0a14",
    title: "#ffffff",
    accentA: "#e22fd0",
    accentB: "#fbbf24",
    muted: "rgba(255,255,255,0.62)",
    font: undefined,
  };
}

/** Shrink the huge surname font so long names don't clip the half-width. */
function nameSize(s: string): number {
  const n = s.length;
  if (n <= 8) return 104;
  if (n <= 11) return 86;
  if (n <= 14) return 70;
  return 56;
}

/** Relative OG image path for the compare page (season + both slots). */
export function compareOgImagePath(args: {
  season: number;
  a: number | null;
  b: number | null;
  sa: SlotSeason;
  sb: SlotSeason;
}): string {
  const p = new URLSearchParams();
  p.set("season", String(args.season));
  if (args.a !== null) {
    p.set("a", String(args.a));
    p.set("sa", String(args.sa));
  }
  if (args.b !== null) {
    p.set("b", String(args.b));
    p.set("sb", String(args.sb));
  }
  return `/api/og/compare?${p.toString()}`;
}

function slotBlock(slot: CompareSlot, accent: string, t: Palette, alignEnd: boolean) {
  const align = alignEnd ? "flex-end" : "flex-start";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: align }}>
      <div
        style={{
          display: "flex",
          fontSize: nameSize(slot.surname),
          fontWeight: 700,
          letterSpacing: "-2px",
          color: accent,
        }}
      >
        {slot.surname.toUpperCase()}
      </div>
      <div style={{ display: "flex", marginTop: 10, fontSize: 27, color: t.muted }}>
        {slot.club} · {slot.label}
      </div>
      <div style={{ display: "flex", marginTop: 6, fontSize: 30, fontWeight: 700, color: accent }}>
        {slot.goals} G · {slot.assists} A
      </div>
    </div>
  );
}

function versusPoster(c: CompareCardContent, t: Palette, a: CompareSlot, b: CompareSlot) {
  return (
    <>
      <div style={{ position: "absolute", left: 80, top: 84, display: "flex" }}>
        {slotBlock(a, t.accentA, t, false)}
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 246,
          width: 1200,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 80,
            fontWeight: 700,
            letterSpacing: "10px",
            color: t.title,
          }}
        >
          VS
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 388,
          width: 1120,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
        }}
      >
        {slotBlock(b, t.accentB, t, true)}
      </div>
    </>
  );
}

function genericPoster(t: Palette) {
  return (
    <div
      style={{ position: "absolute", left: 80, top: 150, display: "flex", flexDirection: "column" }}
    >
      <div
        style={{
          display: "flex",
          fontSize: 32,
          fontWeight: 700,
          letterSpacing: "6px",
          color: t.accentA,
        }}
      >
        PREMIER LEAGUE
      </div>
      <div
        style={{ display: "flex", marginTop: 8, fontSize: 120, fontWeight: 800, color: t.title }}
      >
        Compare
      </div>
      <div style={{ display: "flex", marginTop: 10, fontSize: 32, color: t.muted }}>
        Any two players · any seasons · head to head
      </div>
      <div style={{ display: "flex", alignItems: "center", marginTop: 40 }}>
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            border: `4px solid ${t.accentA}`,
            display: "flex",
          }}
        />
        <div
          style={{
            display: "flex",
            margin: "0 28px",
            fontSize: 50,
            fontWeight: 700,
            color: t.title,
          }}
        >
          VS
        </div>
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            border: `4px solid ${t.accentB}`,
            display: "flex",
          }}
        />
      </div>
    </div>
  );
}

/** Build the 1200×630 compare "versus poster" element for `ImageResponse`. */
export function renderCompareCard(c: CompareCardContent) {
  const t = palette(c.era);
  const both = c.a !== null && c.b !== null;
  return (
    <div
      style={{
        width: 1200,
        height: 630,
        display: "flex",
        position: "relative",
        backgroundColor: t.bg,
        fontFamily: t.font ?? "sans-serif",
      }}
    >
      {both ? versusPoster(c, t, c.a!, c.b!) : genericPoster(t)}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 592,
          width: 1200,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div style={{ display: "flex", fontSize: 24, fontWeight: 500, color: t.muted }}>
          PitchIQ Compare · {c.seasonLabel}
        </div>
      </div>
    </div>
  );
}
