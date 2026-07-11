import type { GoalAttributionPlayer } from "@/data/schemas";

import type { TriviaData } from "../types";

/** This player's attribution entry from the committed map (TASK-M26), or null. */
export async function playerAttribution(
  data: TriviaData,
  id: number,
): Promise<GoalAttributionPlayer | null> {
  const map = await data.goalAttribution();
  return map?.players[String(id)] ?? null;
}

/** A club name for an opponent id from the committed map, or null. */
export async function opponentName(data: TriviaData, teamId: number): Promise<string | null> {
  const map = await data.goalAttribution();
  return map?.teams[String(teamId)] ?? null;
}

/** Display name: focus season first, else a newest-first scan (career framing). */
export async function playerName(data: TriviaData, id: number): Promise<string | null> {
  const focus = (await data.players())?.find((p) => p.id === id);
  if (focus) return focus.name;
  for (const s of await data.seasons()) {
    const p = (await data.players(s))?.find((x) => x.id === id);
    if (p) return p.name;
  }
  return null;
}

/** argmax opponent by goals, lowest-teamId tiebreak. */
export function topOpponent(
  opponents: Record<string, number>,
): { teamId: number; goals: number } | null {
  let best: { teamId: number; goals: number } | null = null;
  for (const [tid, g] of Object.entries(opponents)) {
    const teamId = Number(tid);
    if (best === null || g > best.goals || (g === best.goals && teamId < best.teamId)) {
      best = { teamId, goals: g };
    }
  }
  return best;
}
