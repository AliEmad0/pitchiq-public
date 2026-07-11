import type { Era } from "@/utils/era";

// Fixtures-index OG card (TASK-M53): a grid of crest-vs-crest clashes for the
// season, themed by era. Rendered by `src/app/api/og/fixtures/route.tsx`.

export type FixturesCardTeam = { crestUrl: string | null; abbr: string; color: string };
export type FixturesCardPair = { home: FixturesCardTeam; away: FixturesCardTeam };
export type FixturesCardContent = {
  era: Era;
  seasonLabel: string;
  pairs: FixturesCardPair[];
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

/** Relative OG image path for the fixtures index at a given season. */
export function fixturesOgImagePath(season: number): string {
  return `/api/og/fixtures?season=${season}`;
}

// A crest = the real logo (object-fit contain). Club crests are transparent
// PNGs, so we must NOT layer the abbreviation behind them (it bleeds through the
// logo); the monogram only shows when there's no logo at all. Club logos are
// local committed files, so a miss is rare.
function crest(cx: number, cy: number, r: number, t: FixturesCardTeam) {
  return (
    <div
      style={{
        position: "absolute",
        left: cx - r,
        top: cy - r,
        width: r * 2,
        height: r * 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {t.crestUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={t.crestUrl}
          width={r * 2}
          height={r * 2}
          alt=""
          style={{ objectFit: "contain" }}
        />
      ) : (
        <div style={{ fontSize: r * 0.7, fontWeight: 800, color: t.color, display: "flex" }}>
          {t.abbr}
        </div>
      )}
    </div>
  );
}

const COLS = [300, 600, 900];
const ROWS = [378, 512];

/** Build the 1200×630 fixtures crest-clash-grid element for `ImageResponse`. */
export function renderFixturesCard(c: FixturesCardContent) {
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
          top: 116,
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
          top: 158,
          fontSize: 110,
          fontWeight: 800,
          color: t.title,
          display: "flex",
        }}
      >
        Fixtures
      </div>
      <div
        style={{
          position: "absolute",
          left: 80,
          top: 296,
          fontSize: 26,
          color: t.sub,
          display: "flex",
        }}
      >
        The clashes of {c.seasonLabel}
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

      {c.pairs.slice(0, 6).map((p, i) => {
        const cx = COLS[i % 3];
        const cy = ROWS[Math.floor(i / 3)];
        return (
          <div key={i} style={{ display: "flex" }}>
            {crest(cx - 88, cy, 46, p.home)}
            <div
              style={{
                position: "absolute",
                left: cx - 18,
                top: cy - 20,
                width: 36,
                display: "flex",
                justifyContent: "center",
                fontSize: 34,
                fontWeight: 800,
                color: t.sub,
              }}
            >
              v
            </div>
            {crest(cx + 88, cy, 46, p.away)}
          </div>
        );
      })}
    </div>
  );
}
