import type { Card, Rank, Suit } from "./types";

export const SUITS: Suit[] = ["hearts", "diamonds", "clubs", "spades"];
export const RANKS: Rank[] = [6, 7, 8, 9, 10, 11, 12, 13, 14];

export const HAND_SIZE = 6;

export type Rng = () => number;

/** Deterministic PRNG so games can be reproduced in tests. */
export const mulberry32 = (seed: number): Rng => {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const createDeck = (): Card[] =>
  SUITS.flatMap((suit) => RANKS.map((rank) => ({ suit, rank })));

/** Fisher-Yates shuffle that returns a new array. */
export const shuffle = (cards: Card[], rng: Rng): Card[] => {
  const result = [...cards];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

export const cardId = (card: Card): string => `${card.suit}-${card.rank}`;

export const sameCard = (a: Card, b: Card): boolean =>
  a.suit === b.suit && a.rank === b.rank;
