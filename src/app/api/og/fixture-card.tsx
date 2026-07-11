import type { Era } from "@/utils/era";

import { eraTheme } from "./ticket";

// Fixture-detail OG card (TASK-M53): a matchday ticket stub for one match —
// home crest + score + away crest on the body, "ADMIT ONE" + barcode on the
// stub. Reuses the dashboard `eraTheme` ticket palette. Rendered by
// `src/app/api/og/fixture/route.tsx`.

export type FixtureCardTeam = {
  crestUrl: string | null;
  abbr: string;
  name: string;
  color: string;
};
export type FixtureCardContent = {
  era: Era;
  home: FixtureCardTeam;
  away: FixtureCardTeam;
  homeScore: number | null;
  awayScore: number | null;
  metaLine: string;
  seasonLabel: string;
};

const BARS = [6, 12, 4, 14, 6, 10, 4, 12, 6, 14, 4, 10];

/** Relative OG image path for a fixture detail (season derived from the id). */
export function fixtureOgImagePath(id: string): string {
  return `/api/og/fixture?id=${encodeURIComponent(id)}`;
}

// Crests are transparent PNGs → show the logo directly (no initials layered
// behind, which would bleed through). Monogram only when there's no logo.
function crest(left: number, top: number, size: number, t: FixtureCardTeam) {
  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {t.crestUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={t.crestUrl} width={size} height={size} alt="" style={{ objectFit: "contain" }} />
      ) : (
        <div style={{ fontSize: size * 0.34, fontWeight: 800, color: t.color, display: "flex" }}>
          {t.abbr}
        </div>
      )}
    </div>
  );
}

/** Build the 1200×630 match-ticket element for `ImageResponse`. */
export function renderFixtureCard(c: FixtureCardContent) {
  const t = eraTheme(c.era);
  const played = c.homeScore != null && c.awayScore != null;
  const score = played ? `${c.homeScore}–${c.awayScore}` : "VS";

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

      {/* Perforation (real dashes — Satori can't render repeating gradients) */}
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

      {/* Body */}
      <div
        style={{
          position: "absolute",
          left: 124,
          top: 124,
          fontSize: 23,
          fontWeight: 700,
          letterSpacing: "5px",
          color: t.accent,
          display: "flex",
        }}
      >
        MATCHDAY TICKET
      </div>
      {crest(150, 230, 130, c.home)}
      <div
        style={{
          position: "absolute",
          left: 300,
          top: 248,
          width: 250,
          display: "flex",
          justifyContent: "center",
          fontSize: played ? 96 : 72,
          fontWeight: 700,
          color: t.text,
        }}
      >
        {score}
      </div>
      {crest(560, 230, 130, c.away)}
      <div
        style={{
          position: "absolute",
          left: 124,
          top: 400,
          width: 620,
          display: "flex",
          justifyContent: "center",
          fontSize: 34,
          fontWeight: 700,
          color: t.text,
        }}
      >
        {c.home.name} v {c.away.name}
      </div>
      <div
        style={{
          position: "absolute",
          left: 124,
          top: 462,
          width: 620,
          display: "flex",
          justifyContent: "center",
          fontSize: 24,
          fontWeight: 500,
          color: t.muted,
        }}
      >
        {c.metaLine}
      </div>

      {/* Stub */}
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
          {BARS.map((w, i) => (
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
