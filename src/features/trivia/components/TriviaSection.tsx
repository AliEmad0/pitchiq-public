import { getTrivia } from "../data";
import type { TriviaScope } from "../types";
import { TriviaCard } from "./TriviaCard";

import { revealProps } from "@/utils/reveal";

type Props = {
  scope: TriviaScope;
  season: number;
  /** team id (team scope) / player id (player scope). */
  id?: number;
  className?: string;
  /** "soft" = subtle tinted card (default); "solid" = filled brand color. */
  tone?: "soft" | "solid";
};

/**
 * Server-side trivia seam for the consumer pages (TASK-1103): computes the
 * provable facts via the engine and hands them to the client `<TriviaCard>` as
 * props (so they render in the initial HTML). Renders nothing when the data
 * proves no facts, so the page doesn't show an empty shell.
 */
export async function TriviaSection({ scope, season, id, className, tone }: Props) {
  const facts = await getTrivia(scope, season, id);
  if (facts.length === 0) return null;
  // The reveal wrapper (TASK-1704) sits here, not inside the client
  // <TriviaCard>, so the streamed section rises as one block once it lands.
  return (
    <div {...revealProps()}>
      <TriviaCard facts={facts} className={className} tone={tone} />
    </div>
  );
}
