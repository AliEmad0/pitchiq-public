import type { Player } from "@/data/schemas";
import type { RuleResult, TriviaRule } from "../types";

/** The clear yellow-card leader + the gap to the next player, or null on a tie. */
function topYellows(players: Player[]): { leader: Player; count: number; gap: number } | null {
  const booked = players
    .map((p) => ({ p, y: p.metrics.yellowCards ?? 0 }))
    .filter((x) => x.y > 0)
    .sort((a, b) => b.y - a.y);
  if (booked.length === 0) return null;
  const top = booked[0];
  const second = booked[1]?.y ?? 0;
  if (top.y <= second) return null; // tie at the top → no clear leader
  return { leader: top.p, count: top.y, gap: top.y - second };
}

/** R8 — Discipline: the player with the most yellow cards this season. */
export const disciplineRule: TriviaRule = {
  id: "R8",
  title: "Most yellow cards",
  scopes: ["league"],
  async run(data): Promise<RuleResult | null> {
    const players = await data.players();
    if (!players) return null;
    const top = topYellows(players);
    if (!top) return null;
    const { leader, count, gap } = top;
    return {
      text: `${leader.name} picked up the most yellow cards (${count}) — ${gap} more than any other player.`,
      key: "factDiscipline",
      values: { leader: leader.name, count, gap },
      sources: [{ kind: "players", season: data.season, playerId: leader.id }],
      async verify(d) {
        const ps = await d.players();
        if (!ps) return false;
        const t = topYellows(ps);
        return t !== null && t.leader.id === leader.id && t.count === count && t.gap === gap;
      },
    };
  },
};
