import { HAND_SIZE, createDeck, mulberry32, sameCard, shuffle } from "./deck";
import type { Rng } from "./deck";
import {
  allDefended,
  canAttack,
  canDefend,
  canEnd,
  canTake,
  canTransfer,
} from "./rules";
import type {
  Action,
  Card,
  GameState,
  PlayerView,
  Seat,
} from "./types";

export class IllegalMoveError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IllegalMoveError";
  }
}

export interface CreateGameOptions {
  /** Custom RNG (defaults to Math.random). */
  rng?: Rng;
  /** Deterministic seed; ignored when `rng` is provided. */
  seed?: number;
  /** Force the opening attacker; otherwise the lowest trump decides. */
  firstAttacker?: Seat;
}

const clone = <T>(value: T): T => structuredClone(value);

const other = (seat: Seat): Seat => (seat === 0 ? 1 : 0);

const lowestTrumpRank = (hand: Card[], trump: string): number => {
  const trumps = hand.filter((c) => c.suit === trump).map((c) => c.rank);
  return trumps.length ? Math.min(...trumps) : Number.POSITIVE_INFINITY;
};

export const createGame = (options: CreateGameOptions = {}): GameState => {
  const rng = options.rng ?? (options.seed !== undefined ? mulberry32(options.seed) : Math.random);
  const deck = shuffle(createDeck(), rng);
  const trumpCard = deck[deck.length - 1];
  const trumpSuit = trumpCard.suit;

  const hands: [Card[], Card[]] = [[], []];
  for (let i = 0; i < HAND_SIZE; i++) {
    hands[0].push(deck.shift() as Card);
    hands[1].push(deck.shift() as Card);
  }

  let attacker: Seat = options.firstAttacker ?? 0;
  if (options.firstAttacker === undefined) {
    attacker =
      lowestTrumpRank(hands[0], trumpSuit) <= lowestTrumpRank(hands[1], trumpSuit) ? 0 : 1;
  }

  return {
    deck,
    trumpSuit,
    trumpCard,
    hands,
    table: [],
    discard: [],
    attacker,
    defender: other(attacker),
    turn: attacker,
    phase: "attack",
    winner: null,
    loser: null,
  };
};

const removeFromHand = (hand: Card[], card: Card): void => {
  const index = hand.findIndex((c) => sameCard(c, card));
  if (index === -1) throw new IllegalMoveError("Karte nicht in der Hand");
  hand.splice(index, 1);
};

/** Refill hands up to HAND_SIZE, attacker first, then defender. */
const refill = (state: GameState): void => {
  for (const seat of [state.attacker, state.defender]) {
    while (state.hands[seat].length < HAND_SIZE && state.deck.length > 0) {
      state.hands[seat].push(state.deck.shift() as Card);
    }
  }
};

const checkGameOver = (state: GameState): void => {
  if (state.deck.length > 0) return;
  const empty0 = state.hands[0].length === 0;
  const empty1 = state.hands[1].length === 0;
  if (!empty0 && !empty1) return;

  state.phase = "finished";
  if (empty0 && empty1) {
    state.winner = null;
    state.loser = null;
  } else if (empty0) {
    state.winner = 0;
    state.loser = 1;
  } else {
    state.winner = 1;
    state.loser = 0;
  }
};

export const applyMove = (state: GameState, action: Action): GameState => {
  if (state.phase === "finished") {
    throw new IllegalMoveError("Spiel ist bereits beendet");
  }
  const next = clone(state);

  switch (action.type) {
    case "ATTACK": {
      if (!canAttack(next, action.seat, action.card)) {
        throw new IllegalMoveError("Ungueltiger Angriff");
      }
      removeFromHand(next.hands[action.seat], action.card);
      next.table.push({ attack: action.card });
      if (next.phase === "attack") {
        next.phase = "defense";
        next.turn = next.defender;
      }
      // In the taking phase the attacker keeps throwing in; turn stays put.
      return next;
    }
    case "DEFEND": {
      if (!canDefend(next, action.seat, action.card, action.targetIndex)) {
        throw new IllegalMoveError("Ungueltige Verteidigung");
      }
      removeFromHand(next.hands[action.seat], action.card);
      next.table[action.targetIndex].defense = action.card;
      if (allDefended(next)) {
        next.phase = "attack";
        next.turn = next.attacker;
      } else {
        next.phase = "defense";
        next.turn = next.defender;
      }
      return next;
    }
    case "TRANSFER": {
      if (!canTransfer(next, action.seat, action.card)) {
        throw new IllegalMoveError("Schieben nicht moeglich");
      }
      removeFromHand(next.hands[action.seat], action.card);
      next.table.push({ attack: action.card });
      const newAttacker = next.defender;
      next.attacker = newAttacker;
      next.defender = other(newAttacker);
      next.phase = "defense";
      next.turn = next.defender;
      return next;
    }
    case "TAKE": {
      if (!canTake(next, action.seat)) {
        throw new IllegalMoveError("Aufnehmen nicht moeglich");
      }
      // Defender commits to taking; attacker may now throw in more cards.
      next.phase = "taking";
      next.turn = next.attacker;
      return next;
    }
    case "END": {
      if (!canEnd(next, action.seat)) {
        throw new IllegalMoveError("Runde kann nicht beendet werden");
      }
      if (next.phase === "taking") {
        for (const pair of next.table) {
          next.hands[next.defender].push(pair.attack);
          if (pair.defense) next.hands[next.defender].push(pair.defense);
        }
        next.table = [];
        refill(next);
        next.phase = "attack";
        next.turn = next.attacker;
        checkGameOver(next);
        return next;
      }
      for (const pair of next.table) {
        next.discard.push(pair.attack);
        if (pair.defense) next.discard.push(pair.defense);
      }
      next.table = [];
      refill(next);
      const newAttacker = next.defender;
      next.attacker = newAttacker;
      next.defender = other(newAttacker);
      next.phase = "attack";
      next.turn = next.attacker;
      checkGameOver(next);
      return next;
    }
    default: {
      const exhaustive: never = action;
      throw new IllegalMoveError(`Unbekannte Aktion: ${JSON.stringify(exhaustive)}`);
    }
  }
};

export const getPlayerView = (state: GameState, seat: Seat): PlayerView => {
  const opponent = other(seat);
  return {
    you: seat,
    trumpSuit: state.trumpSuit,
    trumpCard: state.deck.length > 0 ? clone(state.trumpCard) : null,
    deckCount: state.deck.length,
    discardCount: state.discard.length,
    hand: clone(state.hands[seat]),
    opponentCardCount: state.hands[opponent].length,
    table: clone(state.table),
    attacker: state.attacker,
    defender: state.defender,
    turn: state.turn,
    phase: state.phase,
    winner: state.winner,
    loser: state.loser,
  };
};

/** All legal actions for a seat - handy for UI affordances and validation. */
export const getLegalActions = (state: GameState, seat: Seat): Action[] => {
  if (state.phase === "finished") return [];
  const actions: Action[] = [];

  if (seat === state.attacker && (state.phase === "attack" || state.phase === "taking")) {
    for (const card of state.hands[seat]) {
      if (canAttack(state, seat, card)) actions.push({ type: "ATTACK", seat, card });
    }
    if (canEnd(state, seat)) actions.push({ type: "END", seat });
  }

  if (seat === state.defender && state.phase === "defense") {
    state.table.forEach((pair, targetIndex) => {
      if (pair.defense) return;
      for (const card of state.hands[seat]) {
        if (canDefend(state, seat, card, targetIndex)) {
          actions.push({ type: "DEFEND", seat, card, targetIndex });
        }
      }
    });
    for (const card of state.hands[seat]) {
      if (canTransfer(state, seat, card)) actions.push({ type: "TRANSFER", seat, card });
    }
    if (canTake(state, seat)) actions.push({ type: "TAKE", seat });
  }

  return actions;
};
