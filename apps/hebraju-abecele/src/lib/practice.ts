// Weighted random practice: cards you did not know come back more often.

export type Weights = Record<string, number>;

export const START_WEIGHT = 1;
const MIN_WEIGHT = 0.25;
const MAX_WEIGHT = 8;

export function weightOf(weights: Weights, id: string): number {
  const w = weights[id];
  return typeof w === 'number' && w > 0 ? w : START_WEIGHT;
}

/** A card counts as learned after being known twice in a row from the start. */
export function isLearned(weights: Weights, id: string): boolean {
  return weightOf(weights, id) <= MIN_WEIGHT;
}

export function grade(weights: Weights, id: string, known: boolean): Weights {
  const w = weightOf(weights, id);
  const next = known ? Math.max(MIN_WEIGHT, w / 2) : Math.min(MAX_WEIGHT, Math.max(START_WEIGHT, w) * 2);
  return { ...weights, [id]: next };
}

/** Picks a card id by weight, never the current one unless it is the only card. */
export function pickNext(
  ids: string[],
  weights: Weights,
  currentId: string | null,
  random: () => number = Math.random,
): string | null {
  const pool = ids.length > 1 ? ids.filter((id) => id !== currentId) : ids;
  if (pool.length === 0) return null;
  const total = pool.reduce((sum, id) => sum + weightOf(weights, id), 0);
  let r = random() * total;
  for (const id of pool) {
    r -= weightOf(weights, id);
    if (r < 0) return id;
  }
  return pool[pool.length - 1];
}
