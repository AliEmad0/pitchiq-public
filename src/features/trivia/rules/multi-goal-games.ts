import type { RuleResult, TriviaRule } from "../types";
import { playerAttribution, playerName } from "./_goal-attribution";

/** Min "2+ goal" games to surface when the player has zero hat-tricks. */
const MULTI_MIN = 3;

/** R13 — hat-tricks (preferred) or 2+-goal games for a player (events-mined). */
export const multiGoalGamesRule: TriviaRule = {
  id: "R13",
  title: "Multi-goal games",
  scopes: ["player"],
  async run(data, ctx): Promise<RuleResult | null> {
    if (ctx.scope !== "player" || ctx.id === undefined) return null;
    const id = ctx.id;
    const entry = await playerAttribution(data, id);
    if (!entry) return null;
    const name = await playerName(data, id);
    if (!name) return null;

    if (entry.hatTricks >= 1) {
      const h = entry.hatTricks;
      return {
        text: `${name} has scored ${h} Premier League hat-trick${h === 1 ? "" : "s"} in our match data.`,
        key: "factHatTricks",
        values: { name, h },
        sources: [{ kind: "events" }],
        async verify(d) {
          const e = await playerAttribution(d, id);
          return !!e && e.hatTricks === h && e.hatTricks >= 1;
        },
      };
    }

    if (entry.multiGoalGames >= MULTI_MIN) {
      const m = entry.multiGoalGames;
      return {
        text: `${name} has scored 2+ goals in ${m} Premier League matches in our data.`,
        key: "factMultiGoal",
        values: { name, m },
        sources: [{ kind: "events" }],
        async verify(d) {
          const e = await playerAttribution(d, id);
          return (
            !!e && e.hatTricks === 0 && e.multiGoalGames === m && e.multiGoalGames >= MULTI_MIN
          );
        },
      };
    }
    return null;
  },
};
