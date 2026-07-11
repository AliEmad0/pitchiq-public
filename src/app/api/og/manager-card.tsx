import type { Era } from "@/utils/era";

// Manager-profile OG card (TASK-M53): an "accreditation pass" — a lanyard
// credential with the club crest in the header, the manager's headshot, name,
// club, and a centered barcode. Themed by era. Rendered by
// `src/app/api/og/manager/route.tsx`.
//
// Satori notes: the lanyard straps are divs with `clip-path: polygon()`; the
// headshot is an <img> in an overflow-hidden round div (crops to a circle);
// the barcode is a centered flex row of bar divs.

export type ManagerCardContent = {
  era: Era;
  name: string;
  initials: string;
  photoUrl: string | null;
  crestUrl: string | null;
  clubName: string;
  clubColor: string;
  seasonLabel: string;
};

type Palette = { pageBg: string; brand: string; accent: string; font: string | undefined };

function palette(era: Era): Palette {
  if (era === "retro90s")
    return { pageBg: "#e9e0cb", brand: "#241f16", accent: "#8f2b25", font: "Oswald" };
  if (era === "goldenMillennium")
    return { pageBg: "#0b1422", brand: "#eaf2fb", accent: "#2fd4ec", font: "Rajdhani" };
  return { pageBg: "#0c0a14", brand: "#ffffff", accent: "#e22fd0", font: undefined };
}

function contrastOn(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const l = 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
  return l > 150 ? "#0c0a14" : "#ffffff";
}

const BARS = [6, 3, 3, 6, 3, 6, 3, 3, 6, 3, 6, 6, 3, 3, 6, 3, 6, 3, 3, 6, 3, 6, 3, 6];

/** Relative OG image path for a manager profile at a given season. */
export function managerOgImagePath(id: string, season: number): string {
  return `/api/og/manager?id=${id}&season=${season}`;
}

/** Build the 1200×630 manager accreditation-pass element for `ImageResponse`. */
export function renderManagerCard(c: ManagerCardContent) {
  const p = palette(c.era);
  const headerText = contrastOn(c.clubColor);

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
      {/* Lanyard straps (two clip-path slants converging on the clip) + clip */}
      <div
        style={{
          position: "absolute",
          left: 540,
          top: 0,
          width: 70,
          height: 152,
          backgroundColor: c.clubColor,
          clipPath: "polygon(0 0, 36px 0, 62px 152px, 26px 152px)",
          display: "flex",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 590,
          top: 0,
          width: 70,
          height: 152,
          backgroundColor: c.clubColor,
          clipPath: "polygon(34px 0, 70px 0, 44px 152px, 8px 152px)",
          display: "flex",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 560,
          top: 136,
          width: 80,
          height: 20,
          borderRadius: 6,
          backgroundColor: "#9a9aa0",
          display: "flex",
        }}
      />

      {/* Pass card */}
      <div
        style={{
          position: "absolute",
          left: 400,
          top: 160,
          width: 400,
          height: 410,
          borderRadius: 18,
          backgroundColor: "#16131f",
          border: "2px solid #2a2536",
          display: "flex",
        }}
      />

      {/* Faint crest watermark behind the photo */}
      {c.crestUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={c.crestUrl}
          width={280}
          height={280}
          alt=""
          style={{ position: "absolute", left: 460, top: 182, opacity: 0.08, objectFit: "contain" }}
        />
      ) : null}

      {/* Header bar: crest + MANAGER ACCESS */}
      <div
        style={{
          position: "absolute",
          left: 400,
          top: 160,
          width: 400,
          height: 70,
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          backgroundColor: c.clubColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            fontSize: 28,
            fontWeight: 800,
            letterSpacing: "2px",
            color: headerText,
            display: "flex",
          }}
        >
          MANAGER ACCESS
        </div>
      </div>

      {/* Headshot */}
      <div
        style={{
          position: "absolute",
          left: 528,
          top: 250,
          width: 144,
          height: 144,
          borderRadius: 72,
          border: `3px solid ${c.clubColor}`,
          backgroundColor: "#23202e",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {c.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.photoUrl} width={144} height={144} alt="" style={{ objectFit: "cover" }} />
        ) : (
          <div style={{ fontSize: 52, fontWeight: 700, color: "#ffffff", display: "flex" }}>
            {c.initials}
          </div>
        )}
      </div>

      {/* Name + club (centered within the card) */}
      <div
        style={{
          position: "absolute",
          left: 400,
          top: 410,
          width: 400,
          display: "flex",
          justifyContent: "center",
          fontSize: 38,
          fontWeight: 800,
          color: "#ffffff",
        }}
      >
        {c.name}
      </div>
      <div
        style={{
          position: "absolute",
          left: 400,
          top: 460,
          width: 400,
          display: "flex",
          justifyContent: "center",
          fontSize: 22,
          color: "rgba(255,255,255,0.72)",
        }}
      >
        {c.clubName}
      </div>

      {/* Centered barcode */}
      <div
        style={{
          position: "absolute",
          left: 400,
          top: 505,
          width: 400,
          display: "flex",
          justifyContent: "center",
        }}
      >
        {BARS.map((w, i) => (
          <div
            key={i}
            style={{
              width: w,
              height: 40,
              marginLeft: i === 0 ? 0 : 5,
              backgroundColor: "#ffffff",
              display: "flex",
            }}
          />
        ))}
      </div>

      {/* Left brand block */}
      <div
        style={{
          position: "absolute",
          left: 120,
          top: 230,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ fontSize: 52, fontWeight: 800, color: p.brand, display: "flex" }}>
          Premier
        </div>
        <div style={{ fontSize: 52, fontWeight: 800, color: p.brand, display: "flex" }}>League</div>
        <div style={{ marginTop: 12, fontSize: 24, color: p.brand, opacity: 0.7, display: "flex" }}>
          Manager · {c.seasonLabel}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 120,
          top: 535,
          fontSize: 34,
          fontWeight: 700,
          display: "flex",
        }}
      >
        <span style={{ color: p.brand }}>Pitch</span>
        <span style={{ color: p.accent }}>IQ</span>
      </div>
    </div>
  );
}
