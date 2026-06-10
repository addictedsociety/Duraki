export type Suit = "hearts" | "diamonds" | "clubs" | "spades";

/** Numeric ranks: 11 = Jack, 12 = Queen, 13 = King, 14 = Ace. */
export type Rank = 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;

export interface Card {
  suit: Suit;
  rank: Rank;
}

/** Two-player game: seat 0 and seat 1. */
export type Seat = 0 | 1;

export interface TablePair {
  attack: Card;
  defense?: Card;
}

/**
 * - `attack`   : attacker may add a card or end the bout (all defended)
 * - `defense`  : defender must beat, take, or transfer (push) the attack
 * - `taking`   : defender chose to take; attacker may throw in more cards
 * - `finished` : game over
 */
export type GamePhase = "attack" | "defense" | "taking" | "finished";

/**
 * Full authoritative game state. Lives on the server.
 * `deck[0]` is the top of the draw pile, the last element is the bottom
 * (the visible trump card) and is therefore drawn last.
 */
export interface GameState {
  deck: Card[];
  trumpSuit: Suit;
  trumpCard: Card;
  hands: [Card[], Card[]];
  table: TablePair[];
  discard: Card[];
  attacker: Seat;
  defender: Seat;
  turn: Seat;
  phase: GamePhase;
  winner: Seat | null;
  /** The "Durak" (loser). Null while playing or on a draw. */
  loser: Seat | null;
}

export type Action =
  | { type: "ATTACK"; seat: Seat; card: Card }
  | { type: "DEFEND"; seat: Seat; card: Card; targetIndex: number }
  | { type: "TAKE"; seat: Seat }
  | { type: "TRANSFER"; seat: Seat; card: Card }
  | { type: "END"; seat: Seat };

export type ActionType = Action["type"];

/**
 * Redacted state for a single seat. The opponent hand and the draw pile are
 * reduced to counts so a client can never see hidden information.
 */
export interface PlayerView {
  you: Seat;
  trumpSuit: Suit;
  trumpCard: Card | null;
  deckCount: number;
  discardCount: number;
  hand: Card[];
  opponentCardCount: number;
  table: TablePair[];
  attacker: Seat;
  defender: Seat;
  turn: Seat;
  phase: GamePhase;
  winner: Seat | null;
  loser: Seat | null;
}
