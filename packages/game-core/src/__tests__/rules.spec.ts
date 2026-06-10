import { describe, expect, it } from "vitest";
import { createDeck, cardId } from "../deck";
import { beats, canAttack, canDefend } from "../rules";
import type { Card, GameState } from "../types";

const c = (suit: Card["suit"], rank: Card["rank"]): Card => ({ suit, rank });

const baseState = (overrides: Partial<GameState> = {}): GameState => ({
  deck: [c("clubs", 6), c("clubs", 7)],
  trumpSuit: "spades",
  trumpCard: c("clubs", 7),
  hands: [[], []],
  table: [],
  discard: [],
  attacker: 0,
  defender: 1,
  turn: 0,
  phase: "attack",
  winner: null,
  loser: null,
  ...overrides,
});

describe("deck", () => {
  it("contains 36 unique cards", () => {
    const deck = createDeck();
    expect(deck).toHaveLength(36);
    expect(new Set(deck.map(cardId)).size).toBe(36);
  });
});

describe("beats", () => {
  it("higher card of same suit wins", () => {
    expect(beats(c("hearts", 10), c("hearts", 9), "spades")).toBe(true);
    expect(beats(c("hearts", 8), c("hearts", 9), "spades")).toBe(false);
  });

  it("trump beats non-trump", () => {
    expect(beats(c("spades", 6), c("hearts", 14), "spades")).toBe(true);
  });

  it("non-trump never beats trump", () => {
    expect(beats(c("hearts", 14), c("spades", 6), "spades")).toBe(false);
  });

  it("different non-trump suits do not beat each other", () => {
    expect(beats(c("hearts", 14), c("clubs", 6), "spades")).toBe(false);
  });

  it("higher trump beats lower trump", () => {
    expect(beats(c("spades", 10), c("spades", 9), "spades")).toBe(true);
    expect(beats(c("spades", 8), c("spades", 9), "spades")).toBe(false);
  });
});

describe("canAttack", () => {
  it("allows any card on an empty table", () => {
    const state = baseState({ hands: [[c("hearts", 9)], [c("hearts", 10)]] });
    expect(canAttack(state, 0, c("hearts", 9))).toBe(true);
  });

  it("only allows matching ranks once the table has cards", () => {
    const state = baseState({
      hands: [[c("hearts", 9), c("clubs", 12)], [c("hearts", 10)]],
      table: [{ attack: c("diamonds", 9), defense: c("diamonds", 10) }],
    });
    expect(canAttack(state, 0, c("hearts", 9))).toBe(true);
    expect(canAttack(state, 0, c("clubs", 12))).toBe(false);
  });

  it("rejects attacks from the defender", () => {
    const state = baseState({ hands: [[], [c("hearts", 9)]] });
    expect(canAttack(state, 1, c("hearts", 9))).toBe(false);
  });
});

describe("canDefend", () => {
  it("allows a beating card against an undefended attack", () => {
    const state = baseState({
      phase: "defense",
      turn: 1,
      hands: [[], [c("hearts", 10)]],
      table: [{ attack: c("hearts", 9) }],
    });
    expect(canDefend(state, 1, c("hearts", 10), 0)).toBe(true);
  });

  it("rejects a card that cannot beat the attack", () => {
    const state = baseState({
      phase: "defense",
      turn: 1,
      hands: [[], [c("hearts", 8)]],
      table: [{ attack: c("hearts", 9) }],
    });
    expect(canDefend(state, 1, c("hearts", 8), 0)).toBe(false);
  });
});
