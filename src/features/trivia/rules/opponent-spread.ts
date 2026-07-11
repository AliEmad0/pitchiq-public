import type { RuleResult, TriviaRule } from "../types";
import { playerAttribution, playerName } from "./_goal-attribution";

/** Minimum distinct clubs scored against to be notable. */
const SPREAD_MIN = 10;

/** R11 — distinct Premier League clubs a player has scored against (events-mined). */
export const opponentSpreadRule: TriviaRule = {
  id: "R11",
  title: "Opponent spread",
  scopes: ["player"],
  async run(data, ctx): Promise<RuleResult | null> {
    if (ctx.scope !== "player" || ctx.id === undefined) return null;
    const id = ctx.id;
    const entry = await playerAttribution(data, id);
    if (!entry) return null;
    const n = Object.keys(entry.opponents).length;
    if (n < SPREAD_MIN) return null;
    const name = await playerName(data, id);
    if (!name) return null;
    return {
      text: `${name} has scored against ${n} different Premier League clubs in our match data.`,
      key: "factOpponentSpread",
      values: { name, n },
      sources: [{ kind: "events" }],
      async verify(d) {
        const e = await playerAttribution(d, id);
        return !!e && Object.keys(e.opponents).length === n && n >= SPREAD_MIN;
      },
    };
  },
};
