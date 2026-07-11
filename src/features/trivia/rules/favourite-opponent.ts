import type { RuleResult, TriviaRule } from "../types";
import { opponentName, playerAttribution, playerName, topOpponent } from "./_goal-attribution";

/** Minimum goals against a single club to be notable. */
const FAVE_MIN = 4;

/** R12 — the club a player has scored most against (events-mined). */
export const favouriteOpponentRule: TriviaRule = {
  id: "R12",
  title: "Favourite opponent",
  scopes: ["player"],
  async run(data, ctx): Promise<RuleResult | null> {
    if (ctx.scope !== "player" || ctx.id === undefined) return null;
    const id = ctx.id;
    const entry = await playerAttribution(data, id);
    if (!entry) return null;
    const top = topOpponent(entry.opponents);
    if (!top || top.goals < FAVE_MIN) return null;
    const name = await playerName(data, id);
    const club = await opponentName(data, top.teamId);
    if (!name || !club) return null;
    return {
      text: `${name}'s favourite opponent is ${club} — ${top.goals} goals in our match data.`,
      key: "factFavouriteOpponent",
      values: { name, club, goals: top.goals },
      sources: [{ kind: "events" }],
      async verify(d) {
        const e = await playerAttribution(d, id);
        if (!e) return false;
        const t = topOpponent(e.opponents);
        return !!t && t.teamId === top.teamId && t.goals === top.goals && t.goals >= FAVE_MIN;
      },
    };
  },
};
