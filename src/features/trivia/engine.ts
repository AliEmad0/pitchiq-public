import type { TriviaCtx, TriviaData, TriviaFact, TriviaRule } from "./types";
import { RULES } from "./rules";

/** Deterministic djb2 string hash → hex; stable across runs (no Date/random). */
function hashFact(rule: string, text: string): string {
  let h = 5381;
  const s = `${rule}:${text}`;
  for (let i = 0; i < s.length; i++) h = (((h << 5) + h) ^ s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(16);
}

type EngineOpts = {
  /** Override the rule library (tests inject fakes). Defaults to all R1-R10. */
  rules?: TriviaRule[];
  /** Injectable clock for `verifiedAt` (tests pin it). */
  now?: () => string;
};

/**
 * Run every rule that applies to `ctx.scope`, keep only the facts whose claim
 * survives an independent re-derivation (`verify`), and stamp each into a
 * `TriviaFact`. Pure over the injected `TriviaData` — no I/O of its own — so it
 * unit-tests with synthetic fixtures. Order follows the rule library.
 */
export async function generateTrivia(
  data: TriviaData,
  ctx: TriviaCtx,
  opts: EngineOpts = {},
): Promise<TriviaFact[]> {
  const rules = opts.rules ?? RULES;
  const now = opts.now ?? (() => new Date().toISOString());
  const facts: TriviaFact[] = [];
  for (const rule of rules) {
    if (!rule.scopes.includes(ctx.scope)) continue;
    const result = await rule.run(data, ctx);
    if (!result) continue;
    if (!(await result.verify(data))) continue; // defensive — drop unverifiable claims
    facts.push({
      id: hashFact(rule.id, result.text),
      scope: ctx.scope,
      rule: rule.id,
      text: result.text,
      key: result.key,
      values: result.values,
      sources: result.sources,
      verifiedAt: now(),
    });
  }
  return facts;
}
