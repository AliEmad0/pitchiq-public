import { readFile } from "node:fs/promises";
import { join } from "node:path";

import type { Era } from "@/utils/era";

export type BrandMode = "logo" | "ceefax";

export type TicketTheme = {
  pageBg: string;
  ticketFill: string;
  border: string;
  accent: string;
  text: string;
  muted: string;
  barcode: string;
  logoGrad: [string, string] | null;
  brandMode: BrandMode;
  /** undefined → next/og built-in sans (modern). */
  fontFamily: string | undefined;
  gloss: boolean;
  ruled: boolean;
};

/** Per-era palette + typography for the OG matchday ticket (dashboard OG). */
export function eraTheme(era: Era): TicketTheme {
  if (era === "retro90s") {
    return {
      pageBg: "#e9e0cb",
      ticketFill: "#e3d8bc",
      border: "#8f2b25",
      accent: "#8f2b25",
      text: "#241f16",
      muted: "rgba(36,31,22,0.78)",
      barcode: "#241f16",
      logoGrad: null,
      brandMode: "ceefax",
      fontFamily: "Oswald",
      gloss: false,
      ruled: true,
    };
  }
  if (era === "goldenMillennium") {
    return {
      pageBg: "#0b1422",
      ticketFill: "#0e1a2c",
      border: "#2fd4ec",
      accent: "#2fd4ec",
      text: "#eaf2fb",
      muted: "rgba(234,242,251,0.72)",
      barcode: "#9fdfe9",
      logoGrad: ["#7fe9f7", "#11647c"],
      brandMode: "logo",
      fontFamily: "Rajdhani",
      gloss: true,
      ruled: false,
    };
  }
  return {
    pageBg: "#0c0a14",
    ticketFill: "#15121e",
    border: "#2a2536",
    accent: "#e22fd0",
    text: "#ffffff",
    muted: "rgba(255,255,255,0.7)",
    barcode: "#ffffff",
    logoGrad: ["#e22fd0", "#a3179a"],
    brandMode: "logo",
    fontFamily: undefined,
    gloss: false,
    ruled: false,
  };
}

const FONT_DIR = join(process.cwd(), "src/app/api/og/fonts");

export type OgFont = { name: string; data: Buffer; weight: 500 | 700; style: "normal" };

/** Load only the era's fonts (modern → []; next/og's built-in sans renders it). */
export async function loadEraFonts(era: Era): Promise<OgFont[]> {
  if (era === "retro90s") {
    return [
      {
        name: "Oswald",
        data: await readFile(join(FONT_DIR, "Oswald-Medium.ttf")),
        weight: 500,
        style: "normal",
      },
      {
        name: "Oswald",
        data: await readFile(join(FONT_DIR, "Oswald-Bold.ttf")),
        weight: 700,
        style: "normal",
      },
    ];
  }
  if (era === "goldenMillennium") {
    return [
      {
        name: "Rajdhani",
        data: await readFile(join(FONT_DIR, "Rajdhani-Medium.ttf")),
        weight: 500,
        style: "normal",
      },
      {
        name: "Rajdhani",
        data: await readFile(join(FONT_DIR, "Rajdhani-Bold.ttf")),
        weight: 700,
        style: "normal",
      },
    ];
  }
  return [];
}

/** Relative OG image path for the dashboard at a given season (resolved vs metadataBase). */
export function dashboardOgImagePath(season: number): string {
  return `/api/og/dashboard?season=${season}`;
}

export type TicketContent = {
  era: Era;
  seasonLabel: string;
  headline: string;
  tagline: string;
  passLabel: string;
  navLine: string;
};

/** Build the 1200×630 matchday-ticket element for `ImageResponse` (Satori). */
export function renderTicket(c: TicketContent) {
  const t = eraTheme(c.era);
  const barWidths = [6, 12, 4, 14, 6, 10, 4, 12, 6, 14, 4, 10];
  return (
    <div
      style={{
        width: 1200,
        height: 630,
        display: "flex",
        position: "relative",
        backgroundColor: t.pageBg,
        color: t.text,
        fontFamily: t.fontFamily ?? "sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 72,
          top: 80,
          width: 1056,
          height: 470,
          borderRadius: 30,
          backgroundColor: t.ticketFill,
          border: `3px solid ${t.border}`,
          display: "flex",
        }}
      />
      {t.gloss ? (
        <div
          style={{
            position: "absolute",
            left: 75,
            top: 83,
            width: 1050,
            height: 210,
            borderRadius: 28,
            backgroundImage:
              "linear-gradient(to bottom, rgba(255,255,255,0.16), rgba(255,255,255,0))",
            display: "flex",
          }}
        />
      ) : null}
      {t.ruled ? (
        <div
          style={{
            position: "absolute",
            left: 124,
            top: 300,
            width: 660,
            height: 2,
            backgroundColor: "rgba(36,31,22,0.08)",
            display: "flex",
          }}
        />
      ) : null}
      {/* Perforation: a stacked column of dashes. Satori doesn't render
          `repeating-linear-gradient`, so the tear line is built from real
          dash divs (like the barcode). */}
      <div
        style={{
          position: "absolute",
          left: 866,
          top: 100,
          width: 6,
          height: 430,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {Array.from({ length: 24 }).map((_, i) => (
          <div
            key={i}
            style={{ width: 4, height: 9, backgroundColor: t.accent, display: "flex" }}
          />
        ))}
      </div>
      <div
        style={{
          position: "absolute",
          left: 857,
          top: 67,
          width: 26,
          height: 26,
          borderRadius: 13,
          backgroundColor: t.pageBg,
          display: "flex",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 857,
          top: 537,
          width: 26,
          height: 26,
          borderRadius: 13,
          backgroundColor: t.pageBg,
          display: "flex",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 124,
          top: 126,
          width: 700,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {t.brandMode === "logo" ? (
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: 26,
                backgroundImage: `linear-gradient(135deg, ${t.logoGrad![0]}, ${t.logoGrad![1]})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  width: 8,
                  height: 46,
                  backgroundColor: "rgba(255,255,255,0.92)",
                  display: "flex",
                }}
              />
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  border: "7px solid rgba(255,255,255,0.92)",
                  display: "flex",
                }}
              />
            </div>
            <div
              style={{
                marginLeft: 30,
                fontSize: 76,
                fontWeight: 700,
                letterSpacing: "-2px",
                display: "flex",
              }}
            >
              {c.headline}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                backgroundColor: "#0a0a0a",
                padding: "6px 12px",
                marginBottom: 12,
                alignSelf: "flex-start",
              }}
            >
              <div style={{ fontSize: 24, fontWeight: 700, color: "#ffffff", display: "flex" }}>
                PITCHIQ
              </div>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: "#3ad13a",
                  marginLeft: 16,
                  display: "flex",
                }}
              >
                P101
              </div>
              <div
                style={{
                  width: 24,
                  height: 28,
                  backgroundColor: "#ffd23a",
                  marginLeft: 18,
                  display: "flex",
                }}
              />
              <div
                style={{
                  width: 24,
                  height: 28,
                  backgroundColor: "#2fb6e0",
                  marginLeft: 6,
                  display: "flex",
                }}
              />
              <div
                style={{
                  width: 24,
                  height: 28,
                  backgroundColor: "#e0518a",
                  marginLeft: 6,
                  display: "flex",
                }}
              />
            </div>
            <div style={{ fontSize: 66, fontWeight: 700, letterSpacing: "-2px", display: "flex" }}>
              {c.headline}
            </div>
          </div>
        )}
        <div
          style={{
            fontSize: 23,
            fontWeight: 500,
            letterSpacing: "5px",
            color: t.accent,
            marginTop: 36,
            display: "flex",
          }}
        >
          {c.passLabel}
        </div>
        <div
          style={{ fontSize: 42, fontWeight: 500, color: t.muted, marginTop: 18, display: "flex" }}
        >
          {c.tagline}
        </div>
        <div
          style={{
            fontSize: 25,
            fontWeight: 500,
            letterSpacing: "1px",
            color: t.muted,
            marginTop: 36,
            display: "flex",
          }}
        >
          {c.navLine}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 892,
          top: 150,
          width: 232,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            fontSize: 50,
            fontWeight: 700,
            letterSpacing: "3px",
            color: t.accent,
            display: "flex",
          }}
        >
          ADMIT
        </div>
        <div
          style={{
            fontSize: 50,
            fontWeight: 700,
            letterSpacing: "8px",
            color: t.accent,
            marginTop: 2,
            display: "flex",
          }}
        >
          ONE
        </div>
        <div style={{ display: "flex", marginTop: 44 }}>
          {barWidths.map((w, i) => (
            <div
              key={i}
              style={{
                width: w,
                height: 104,
                backgroundColor: t.barcode,
                marginLeft: i === 0 ? 0 : 6,
                display: "flex",
              }}
            />
          ))}
        </div>
        <div
          style={{
            fontSize: 20,
            fontWeight: 500,
            letterSpacing: "1px",
            color: t.muted,
            marginTop: 30,
            display: "flex",
          }}
        >
          SEASON {c.seasonLabel}
        </div>
      </div>
    </div>
  );
}
