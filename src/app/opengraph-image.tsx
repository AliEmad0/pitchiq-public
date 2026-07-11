// Next 15 file-convention OG image route.
// Renders a 1200x630 PNG via next/og (Satori). Auto-wired into the
// root layout's metadata.openGraph.images and metadata.twitter.images.
//
// Why hardcoded #0c0a14 instead of var(--background): Satori (the engine
// behind next/og) only parses a subset of CSS — no CSS variables, no OKLCH.
// #0c0a14 is the app's dark `--background` token since TASK-909's PL-purple
// palette (previously the old slate-dark approximation).

import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "PitchIQ — Premier League, decoded.";

export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "96px",
        backgroundColor: "#0c0a14",
        backgroundImage: "radial-gradient(at top left, rgba(255,255,255,0.06), transparent 50%)",
        color: "white",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          width: 96,
          height: 96,
          borderRadius: 26,
          backgroundImage: "linear-gradient(135deg, #e22fd0, #a3179a)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 4,
            height: 64,
            backgroundColor: "rgba(255,255,255,0.9)",
          }}
        />
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            border: "4px solid rgba(255,255,255,0.9)",
          }}
        />
      </div>
      <div
        style={{
          fontSize: 112,
          fontWeight: 700,
          letterSpacing: "-0.04em",
          marginTop: 12,
        }}
      >
        PitchIQ
      </div>
      <div style={{ fontSize: 42, marginTop: 16, opacity: 0.7 }}>Premier League, decoded.</div>
      <div
        style={{
          fontSize: 22,
          marginTop: 72,
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          opacity: 0.5,
        }}
      >
        Standings · Leaderboards · Fixtures
      </div>
    </div>,
    { ...size },
  );
}
