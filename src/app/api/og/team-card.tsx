import { readFile } from "node:fs/promises";
import { join } from "node:path";

import type { Era } from "@/utils/era";

import { loadEraFonts, type OgFont } from "./ticket";

// Team-profile OG card (TASK-M53). Owner-chosen hybrid:
//   • modern + goldenMillennium  → NEON (glowing crest + wordmark in the club
//     colour, dark field). Glow is real (Satori box-shadow / text-shadow blur).
//   • retro90s                   → DOSSIER, rendered in the "modern" dossier
//     palette (dark field + cream file card + magenta accent + Space Mono).
// Rendered by `src/app/api/og/team/route.tsx`.

export type TeamCardContent = {
  era: Era;
  clubName: string;
  crestUrl: string | null;
  /** Club home-kit hex (TASK-M47 team-colors); used for the neon glow. */
  clubColor: string | null;
  seasonLabel: string;
  rankLabel: string;
  points: number;
  goalDiff: string;
};

const FONT_DIR = join(process.cwd(), "src/app/api/og/fonts");

/** Fonts per era: modern → bundled sans; golden → Rajdhani; retro → Space Mono. */
export async function loadTeamCardFonts(era: Era): Promise<OgFont[]> {
  if (era === "goldenMillennium") return loadEraFonts("goldenMillennium");
  if (era === "retro90s") {
    return [
      {
        name: "Space Mono",
        data: await readFile(join(FONT_DIR, "SpaceMono-Regular.ttf")),
        weight: 500,
        style: "normal",
      },
      {
        name: "Space Mono",
        data: await readFile(join(FONT_DIR, "SpaceMono-Bold.ttf")),
        weight: 700,
        style: "normal",
      },
    ];
  }
  return [];
}

/** Relative OG image path for a team profile at a given season. */
export function teamOgImagePath(teamId: number | string, season: number): string {
  return `/api/og/team?teamId=${teamId}&season=${season}`;
}

function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
}

type NeonPalette = {
  pageBg: string;
  accent: string;
  sub: string;
  nameFont: string | undefined;
  reflection: boolean;
};

function neonPalette(era: Era): NeonPalette {
  if (era === "goldenMillennium")
    return {
      pageBg: "#04121b",
      accent: "#2fd4ec",
      sub: "rgba(200,240,250,0.82)",
      nameFont: "Rajdhani",
      reflection: true,
    };
  return {
    pageBg: "#050509",
    accent: "#e22fd0",
    sub: "rgba(255,255,255,0.72)",
    nameFont: undefined,
    reflection: false,
  };
}

function renderNeon(c: TeamCardContent) {
  const p = neonPalette(c.era);
  // A near-black club colour (e.g. Newcastle) would glow invisibly on the dark
  // field, so fall back to the era accent for the glow in that case.
  const glow = c.clubColor && luminance(c.clubColor) > 40 ? c.clubColor : p.accent;
  const name = c.clubName.toUpperCase();
  const nameSize = name.length > 16 ? 52 : name.length > 11 ? 66 : 80;

  return (
    <div
      style={{
        width: 1200,
        height: 630,
        display: "flex",
        position: "relative",
        backgroundColor: p.pageBg,
        fontFamily: p.nameFont ?? "sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 80,
          top: 64,
          fontSize: 28,
          fontWeight: 700,
          letterSpacing: "5px",
          color: p.accent,
          display: "flex",
        }}
      >
        PITCHIQ
      </div>

      <div
        style={{
          position: "absolute",
          left: 460,
          top: 110,
          width: 280,
          height: 280,
          borderRadius: 140,
          backgroundColor: glow,
          opacity: 0.18,
          boxShadow: `0 0 90px 26px ${glow}`,
          display: "flex",
        }}
      />
      {c.crestUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={c.crestUrl}
          width={210}
          height={210}
          alt=""
          style={{ position: "absolute", left: 495, top: 145, objectFit: "contain" }}
        />
      ) : null}

      <div
        style={{
          position: "absolute",
          left: 0,
          top: 430,
          width: 1200,
          display: "flex",
          justifyContent: "center",
          fontSize: nameSize,
          fontWeight: 800,
          letterSpacing: "1px",
          color: "#ffffff",
          textShadow: `0 0 16px ${glow}, 0 0 34px ${glow}`,
        }}
      >
        {name}
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 530,
          width: 1200,
          display: "flex",
          justifyContent: "center",
          fontSize: 30,
          fontWeight: 700,
          letterSpacing: "3px",
          color: p.sub,
        }}
      >
        {c.rankLabel} · {c.points} PTS · {c.seasonLabel}
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          top: 470,
          width: 1200,
          height: 3,
          backgroundColor: p.accent,
          opacity: 0.55,
          display: "flex",
        }}
      />
      {p.reflection ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 478,
            width: 1200,
            height: 2,
            backgroundColor: p.accent,
            opacity: 0.28,
            display: "flex",
          }}
        />
      ) : null}
    </div>
  );
}

function dossierRow(label: string, value: string): string {
  const dots = ".".repeat(Math.max(3, 16 - label.length));
  return `${label} ${dots} ${value}`;
}

function renderDossier(c: TeamCardContent) {
  const accent = "#a3179a";
  const ink = "#241f16";
  const rows: Array<[string, string]> = [
    ["POSITION", c.rankLabel],
    ["POINTS", String(c.points)],
    ["GOAL DIFF", c.goalDiff],
  ];
  const name = c.clubName.toUpperCase();
  const nameSize = name.length > 16 ? 36 : 46;

  return (
    <div
      style={{
        width: 1200,
        height: 630,
        display: "flex",
        position: "relative",
        backgroundColor: "#0c0a14",
        fontFamily: "Space Mono",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 110,
          top: 80,
          width: 980,
          height: 470,
          borderRadius: 6,
          backgroundColor: "#e9e3d4",
          display: "flex",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 150,
          top: 122,
          fontSize: 28,
          fontWeight: 700,
          letterSpacing: "4px",
          color: accent,
          display: "flex",
        }}
      >
        CLUB DOSSIER
      </div>
      <div
        style={{
          position: "absolute",
          left: 150,
          top: 166,
          width: 900,
          height: 2,
          backgroundColor: "#bcae93",
          display: "flex",
        }}
      />

      {c.crestUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={c.crestUrl}
          width={120}
          height={150}
          alt=""
          style={{ position: "absolute", left: 170, top: 196, objectFit: "contain" }}
        />
      ) : null}
      <div
        style={{
          position: "absolute",
          left: 330,
          top: 210,
          fontSize: nameSize,
          fontWeight: 700,
          color: ink,
          display: "flex",
        }}
      >
        {name}
      </div>
      <div
        style={{
          position: "absolute",
          left: 330,
          top: 276,
          fontSize: 22,
          color: "#4a4336",
          display: "flex",
        }}
      >
        PREMIER LEAGUE // {c.seasonLabel}
      </div>

      {rows.map(([label, value], i) => (
        <div
          key={label}
          style={{
            position: "absolute",
            left: 150,
            top: 378 + i * 42,
            fontSize: 26,
            color: ink,
            display: "flex",
          }}
        >
          {dossierRow(label, value)}
        </div>
      ))}

      <div
        style={{
          position: "absolute",
          left: 770,
          top: 200,
          width: 240,
          height: 92,
          transform: "rotate(-12deg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "5px solid #c0392b",
          borderRadius: 6,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 10,
            top: 10,
            width: 210,
            height: 62,
            border: "2px solid #c0392b",
            borderRadius: 4,
            display: "flex",
          }}
        />
        <div
          style={{
            fontSize: 30,
            fontWeight: 700,
            letterSpacing: "2px",
            color: "#c0392b",
            display: "flex",
          }}
        >
          {c.rankLabel.toUpperCase()} PLACE
        </div>
      </div>
    </div>
  );
}

/** Build the 1200×630 team-profile card element for `ImageResponse`. */
export function renderTeamCard(c: TeamCardContent) {
  return c.era === "retro90s" ? renderDossier(c) : renderNeon(c);
}
