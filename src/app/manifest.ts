import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PitchIQ",
    short_name: "PitchIQ",
    description:
      "PitchIQ decodes the Premier League — live standings, leaderboards, fixtures, half-time scores, and head-to-head player comparisons across 33 seasons.",
    start_url: "/",
    display: "standalone",
    background_color: "#0c0a14",
    theme_color: "#0c0a14",
    icons: [{ src: "/icon.svg", type: "image/svg+xml", sizes: "any" }],
  };
}
