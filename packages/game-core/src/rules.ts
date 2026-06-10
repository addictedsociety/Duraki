import { sameCard } from "./deck";
import type { Card, GameState, Seat, Suit } from "./types";

export const MAX_TABLE_PAIRS = 6;

/** True if `defense` legally beats `attack` given the trump suit. */
export const beats = (defense: Card, attack: Card, trump: Suit): boolean => {
  if (defense.suit === attack.suit) {
    return defense.rank > attack.rank;
  }
  return defense.suit === trump && attack.suit !== trump;
};

const handHas = (hand: Card[], card: Card): boolean =>
  hand.some((c) => sameCard(c, card));

const ranksOnTable = (state: GameState): Set<number> => {
  const ranks = new Set<number>();
  for (const pair of state.table) {
    ranks.add(pair.attack.rank);
    if (pair.defense) ranks.add(pair.defense.rank);
  }
  return ranks;
};

export const undefendedCount = (state: GameState): number =>
  state.table.filter((pair) => !pair.defense).length;

export const allDefended = (state: GameState): boolean =>
  state.table.length > 0 && state.table.every((pair) => pair.defense);

export const canAttack = (
  state: GameState,
  seat: Seat,
  card: Card,
): boolean => {
  if (seat !== state.attacker) return false;
  if (state.phase !== "attack" && state.phase !== "taking") return false;
  if (!handHas(state.hands[seat], card)) return false;
  if (state.table.length >= MAX_TABLE_PAIRS) return false;
  // In the attack phase the defender must still be able to answer.
  if (state.phase === "attack" && state.hands[state.defender].length <= undefendedCount(state)) {
    return false;
  }
  if (state.table.length === 0) return true;
  return ranksOnTable(state).has(card.rank);
};

export const canDefend = (
  state: GameState,
  seat: Seat,
  card: Card,
  targetIndex: number,
): boolean => {
  if (state.phase !== "defense" || seat !== state.defender) return false;
  const pair = state.table[targetIndex];
  if (!pair || pair.defense) return false;
  if (!handHas(state.hands[seat], card)) return false;
  return beats(card, pair.attack, state.trumpSuit);
};

export const canTake = (state: GameState, seat: Seat): boolean =>
  state.phase === "defense" &&
  seat === state.defender &&
  state.table.length > 0;

/**
 * Transfer ("Schieben" / перевод): the defender adds a card of the same rank
 * as the (still undefended) attacks and passes the bout to the opponent.
 */
export const canTransfer = (
  state: GameState,
  seat: Seat,
  card: Card,
): boolean => {
  if (state.phase !== "defense" || seat !== state.defender) return false;
  if (state.table.length === 0 || state.table.length >= MAX_TABLE_PAIRS) return false;
  if (!handHas(state.hands[seat], card)) return false;
  if (state.table.some((pair) => pair.defense)) return false;
  if (state.table.some((pair) => pair.attack.rank !== card.rank)) return false;
  // The opponent must be able to defend the resulting stack.
  return state.hands[state.attacker].length >= state.table.length + 1;
};

export const canEnd = (state: GameState, seat: Seat): boolean => {
  if (seat !== state.attacker) return false;
  if (state.phase === "taking") return true;
  return state.phase === "attack" && allDefended(state);
};

export const isGameOver = (state: GameState): boolean =>
  state.phase === "finished";
