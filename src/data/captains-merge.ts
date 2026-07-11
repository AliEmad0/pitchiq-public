import type { CaptainsFile } from "@/data/schemas";

/**
 * TASK-M42 — merge a hand-authored captain-override map over the derived
 * `captains.json`. Overrides win per (season, teamId); seasons/teams present in
 * only one map are kept. Pure (no I/O) so it's unit-tested independently of
 * `loadCaptains`. Either side may be null/absent.
 */
export function mergeCaptains(
  base: CaptainsFile | null,
  overrides: CaptainsFile | null,
): CaptainsFile {
  const out: CaptainsFile = {};
  for (const [season, teams] of Object.entries(base ?? {})) {
    out[season] = { ...teams };
  }
  for (const [season, teams] of Object.entries(overrides ?? {})) {
    out[season] = { ...(out[season] ?? {}), ...teams };
  }
  return out;
}
