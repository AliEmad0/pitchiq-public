import type { Era } from "@/utils/era";

import { eraTheme } from "./ticket";

// Teams-index OG card (TASK-M53): a diagonal-split share card themed by era.
// Reuses `eraTheme` from the dashboard ticket for the per-era palette + fonts
// so the whole app's OG identity stays in lockstep, but has its own layout
// (NOT the matchday ticket). Rendered by `src/app/api/og/teams/route.tsx`.
//
// Satori notes: every element with children needs `display: flex`; the wedge
// is a full-size div with a `clip-path: polygon(...)` (Satori supports it);
// crests are absolutely-positioned <img> at scatter coordinates.

export type TeamsCardContent = {
  era: Era;
  seasonLabel: string;
  /** Up to 7 absolute crest image URLs (resolved against the site origin). */
  crestUrls: string[];
};

// Light text colours that sit on the (dark) era wedge — distinct from
// `eraTheme.text` (which is tuned for the era's PAGE background, e.g. retro's
// dark ink on cream). The wedge is always dark, so title text is always light.
type OnWedge = { title: string; sub: string; label: string };
function onWedge(era: Era): OnWedge {
  if (era === "retro90s") return { title: "#f3ead2", sub: "rgba(243,234,210,0.92)", label: "" };
  if (era === "goldenMillennium")
    return { title: "#eaf2fb", sub: "rgba(234,242,251,0.88)", label: "#9fe9f7" };
  return { title: "#ffffff", sub: "rgba(255,255,255,0.85)", label: "#ffd6f6" };
}

const SCATTER = [
  { cx: 840, cy: 150, r: 52 },
  { cx: 990, cy: 250, r: 46 },
  { cx: 1110, cy: 170, r: 40 },
  { cx: 900, cy: 400, r: 52 },
  { cx: 1050, cy: 380, r: 44 },
  { cx: 1140, cy: 300, r: 34 },
  { cx: 970, cy: 500, r: 40 },
] as const;

const TITLE_LINES = ["Premier", "League", "Clubs"] as const;

/** Relative OG image path for the teams index at a given season. */
export function teamsOgImagePath(season: number): string {
  return `/api/og/teams?season=${season}`;
}

/** Build the 1200×630 diagonal-split teams card element for `ImageResponse`. */
export function renderTeamsCard(c: TeamsCardContent) {
  const t = eraTheme(c.era);
  const w = onWedge(c.era);
  // Wedge fill = the era's deep brand tone: the dark end of the logo gradient
  // (modern #a3179a, golden #11647c) or the accent for retro (#8f2b25).
  const wedge = t.logoGrad ? t.logoGrad[1] : t.accent;
  const font = t.fontFamily ?? "sans-serif";

  return (
    <div
      style={{
        width: 1200,
        height: 630,
        display: "flex",
        position: "relative",
        backgroundColor: t.pageBg,
        fontFamily: font,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 1200,
          height: 630,
          backgroundColor: wedge,
          clipPath: "polygon(0 0, 640px 0, 440px 630px, 0 630px)",
          display: "flex",
        }}
      />
      {t.gloss ? (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 1200,
            height: 630,
            backgroundColor: "rgba(255,255,255,0.10)",
            clipPath: "polygon(0 0, 640px 0, 545px 300px, 0 300px)",
            display: "flex",
          }}
        />
      ) : null}
      {t.gloss ? (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 1200,
            height: 630,
            backgroundColor: t.accent,
            clipPath: "polygon(636px 0, 642px 0, 442px 630px, 436px 630px)",
            display: "flex",
          }}
        />
      ) : null}

      {c.crestUrls.slice(0, SCATTER.length).map((url, i) => {
        const s = SCATTER[i];
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={url}
            width={s.r * 2}
            height={s.r * 2}
            alt=""
            style={{
              position: "absolute",
              left: s.cx - s.r,
              top: s.cy - s.r,
              objectFit: "contain",
            }}
          />
        );
      })}

      {t.brandMode === "ceefax" ? (
        <div
          style={{
            position: "absolute",
            left: 80,
            top: 120,
            display: "flex",
            alignItems: "center",
            backgroundColor: "#0a0a0a",
            padding: "8px 14px",
          }}
        >
          <div
            style={{
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: "3px",
              color: "#ffffff",
              display: "flex",
            }}
          >
            PITCHIQ
          </div>
          <div
            style={{
              width: 26,
              height: 30,
              backgroundColor: "#ffd23a",
              marginLeft: 16,
              display: "flex",
            }}
          />
          <div
            style={{
              width: 26,
              height: 30,
              backgroundColor: "#2fb6e0",
              marginLeft: 6,
              display: "flex",
            }}
          />
          <div
            style={{
              width: 26,
              height: 30,
              backgroundColor: "#e0518a",
              marginLeft: 6,
              display: "flex",
            }}
          />
        </div>
      ) : (
        <div
          style={{
            position: "absolute",
            left: 80,
            top: 130,
            fontSize: 30,
            fontWeight: 700,
            letterSpacing: "6px",
            color: w.label,
            display: "flex",
          }}
        >
          PITCHIQ
        </div>
      )}

      <div
        style={{
          position: "absolute",
          left: 80,
          top: 200,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {TITLE_LINES.map((line) => (
          <div
            key={line}
            style={{
              fontSize: 74,
              fontWeight: 700,
              lineHeight: 1.05,
              color: w.title,
              display: "flex",
            }}
          >
            {line}
          </div>
        ))}
      </div>

      {t.ruled ? (
        <div
          style={{
            position: "absolute",
            left: 80,
            top: 458,
            width: 360,
            height: 3,
            backgroundColor: "rgba(243,234,210,0.5)",
            display: "flex",
          }}
        />
      ) : null}

      <div
        style={{
          position: "absolute",
          left: 82,
          top: 486,
          fontSize: 24,
          fontWeight: 500,
          color: w.sub,
          display: "flex",
        }}
      >
        Season {c.seasonLabel}
      </div>
    </div>
  );
}
