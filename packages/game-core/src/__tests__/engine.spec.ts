import { describe, expect, it } from "vitest";
import { mulberry32 } from "../deck";
import {
  IllegalMoveError,
  applyMove,
  createGame,
  getLegalActions,
  getPlayerView,
} from "../engine";
import type { Card, GameState } from "../types";

const c = (suit: Card["suit"], rank: Card["rank"]): Card => ({ suit, rank });

const countCards = (state: GameState): number => {
  let count = state.deck.length + state.discard.length;
  count += state.hands[0].length + state.hands[1].length;
  for (const pair of state.table) {
    count += 1 + (pair.defense ? 1 : 0);
  }
  return count;
};

describe("createGame", () => {
  it("deals six cards each and keeps the rest in the deck", () => {
    const state = createGame({ seed: 42 });
    expect(state.hands[0]).toHaveLength(6);
    expect(state.hands[1]).toHaveLength(6);
    expect(state.deck).toHaveLength(24);
    expect(countCards(state)).toBe(36);
  });

  it("sets the trump from the bottom card", () => {
    const state = createGame({ seed: 42 });
    expect(state.trumpCard.suit).toBe(state.trumpSuit);
    expect(state.deck[state.deck.length - 1]).toEqual(state.trumpCard);
  });

  it("lets the lowest trump open the game", () => {
    const state = createGame({ seed: 7 });
    const min = (hand: Card[]) => {
      const trumps = hand.filter((card) => card.suit === state.trumpSuit);
      return trumps.length ? Math.min(...trumps.map((t) => t.rank)) : Infinity;
    };
    const expected = min(state.hands[0]) <= min(state.hands[1]) ? 0 : 1;
    expect(state.attacker).toBe(expected);
  });
});

describe("applyMove", () => {
  it("does not mutate the input state", () => {
    const state = createGame({ seed: 1, firstAttacker: 0 });
    const card = state.hands[0][0];
    const before = structuredClone(state);
    applyMove(state, { type: "ATTACK", seat: 0, card });
    expect(state).toEqual(before);
  });

  it("moves an attack card to the table and hands the turn to the defender", () => {
    const state = createGame({ seed: 1, firstAttacker: 0 });
    const card = state.hands[0][0];
    const next = applyMove(state, { type: "ATTACK", seat: 0, card });
    expect(next.table).toHaveLength(1);
    expect(next.phase).toBe("defense");
    expect(next.turn).toBe(1);
    expect(next.hands[0]).toHaveLength(5);
  });

  it("throws on an illegal move", () => {
    const state = createGame({ seed: 1, firstAttacker: 0 });
    const defenderCard = state.hands[1][0];
    expect(() => applyMove(state, { type: "ATTACK", seat: 1, card: defenderCard })).toThrow(
      IllegalMoveError,
    );
  });

  it("lets the defender take, the attacker throw in, then finalizes the pickup", () => {
    const state: GameState = {
      deck: [],
      trumpSuit: "spades",
      trumpCard: c("clubs", 6),
      hands: [[c("hearts", 9), c("clubs", 9)], [c("diamonds", 6), c("diamonds", 7)]],
      table: [],
      discard: [],
      attacker: 0,
      defender: 1,
      turn: 0,
      phase: "attack",
      winner: null,
      loser: null,
    };
    const attacked = applyMove(state, { type: "ATTACK", seat: 0, card: c("hearts", 9) });
    const taking = applyMove(attacked, { type: "TAKE", seat: 1 });
    expect(taking.phase).toBe("taking");
    expect(taking.turn).toBe(0);
    // Attacker throws in another 9 while the defender is taking.
    const thrown = applyMove(taking, { type: "ATTACK", seat: 0, card: c("clubs", 9) });
    expect(thrown.table).toHaveLength(2);
    const taken = applyMove(thrown, { type: "END", seat: 0 });
    expect(taken.hands[1]).toContainEqual(c("hearts", 9));
    expect(taken.hands[1]).toContainEqual(c("clubs", 9));
    expect(taken.attacker).toBe(0);
    expect(taken.table).toHaveLength(0);
  });

  it("transfers (pushes) the bout to the opponent on a matching rank", () => {
    const state: GameState = {
      deck: [],
      trumpSuit: "spades",
      trumpCard: c("clubs", 6),
      hands: [
        [c("hearts", 9), c("hearts", 10), c("hearts", 6)],
        [c("clubs", 9), c("diamonds", 8)],
      ],
      table: [],
      discard: [],
      attacker: 0,
      defender: 1,
      turn: 0,
      phase: "attack",
      winner: null,
      loser: null,
    };
    const attacked = applyMove(state, { type: "ATTACK", seat: 0, card: c("hearts", 9) });
    const transferred = applyMove(attacked, { type: "TRANSFER", seat: 1, card: c("clubs", 9) });
    expect(transferred.attacker).toBe(1);
    expect(transferred.defender).toBe(0);
    expect(transferred.phase).toBe("defense");
    expect(transferred.turn).toBe(0);
    expect(transferred.table).toHaveLength(2);
    expect(transferred.table.every((pair) => !pair.defense)).toBe(true);
  });

  it("rejects a transfer once a card has been defended", () => {
    const state: GameState = {
      deck: [],
      trumpSuit: "spades",
      trumpCard: c("clubs", 6),
      hands: [[c("hearts", 9)], [c("clubs", 9), c("hearts", 10)]],
      table: [{ attack: c("diamonds", 9), defense: c("diamonds", 10) }, { attack: c("hearts", 9) }],
      discard: [],
      attacker: 0,
      defender: 1,
      turn: 1,
      phase: "defense",
      winner: null,
      loser: null,
    };
    expect(() => applyMove(state, { type: "TRANSFER", seat: 1, card: c("clubs", 9) })).toThrow(
      IllegalMoveError,
    );
  });

  it("swaps roles after a successful defense and END", () => {
    const state: GameState = {
      deck: [],
      trumpSuit: "spades",
      trumpCard: c("clubs", 6),
      hands: [[c("hearts", 9)], [c("hearts", 10), c("clubs", 6)]],
      table: [],
      discard: [],
      attacker: 0,
      defender: 1,
      turn: 0,
      phase: "attack",
      winner: null,
      loser: null,
    };
    const attacked = applyMove(state, { type: "ATTACK", seat: 0, card: c("hearts", 9) });
    const defended = applyMove(attacked, {
      type: "DEFEND",
      seat: 1,
      card: c("hearts", 10),
      targetIndex: 0,
    });
    const ended = applyMove(defended, { type: "END", seat: 0 });
    expect(ended.discard).toHaveLength(2);
    // Attacker emptied their hand with the deck empty -> they win.
    expect(ended.phase).toBe("finished");
    expect(ended.winner).toBe(0);
    expect(ended.loser).toBe(1);
  });
});

describe("getPlayerView", () => {
  it("hides the opponent hand and the draw pile", () => {
    const state = createGame({ seed: 5 });
    const view = getPlayerView(state, 0);
    expect(view.hand).toHaveLength(6);
    expect(view.opponentCardCount).toBe(6);
    expect(view.deckCount).toBe(24);
    expect(view.trumpCard).not.toBeNull();
    expect(view).not.toHaveProperty("deck");
  });
});

describe("full game simulation", () => {
  it("always terminates and conserves all 36 cards", () => {
    for (let seed = 0; seed < 25; seed++) {
      let state = createGame({ seed });
      const pick = mulberry32(seed + 1000);
      let guard = 0;
      while (state.phase !== "finished" && guard < 5000) {
        const actions = getLegalActions(state, state.turn);
        expect(actions.length).toBeGreaterThan(0);
        const action = actions[Math.floor(pick() * actions.length)];
        state = applyMove(state, action);
        expect(countCards(state)).toBe(36);
        guard++;
      }
      expect(state.phase).toBe("finished");
      if (state.winner !== null) {
        expect(state.loser).toBe(state.winner === 0 ? 1 : 0);
      }
    }
  });
});
