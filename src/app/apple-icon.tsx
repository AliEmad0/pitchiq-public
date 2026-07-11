import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Apple touch icon — the PitchIQ mark drawn with divs (Satori-safe, no SVG/
// CSS-var quirks), full-bleed magenta gradient, no transparency (iOS applies
// its own rounding).
export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        backgroundImage: "linear-gradient(135deg, #e22fd0, #a3179a)",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 8,
          height: 116,
          backgroundColor: "rgba(255,255,255,0.92)",
        }}
      />
      <div
        style={{
          width: 60,
          height: 60,
          borderRadius: "50%",
          border: "8px solid rgba(255,255,255,0.92)",
        }}
      />
    </div>,
    { ...size },
  );
}
