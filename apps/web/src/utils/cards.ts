import type { Card, Rank, Suit } from "@/types/game.type";

export const SUIT_SYMBOL: Record<Suit, string> = {
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
  spades: "♠",
};

export const SUIT_LABEL: Record<Suit, string> = {
  hearts: "Herz",
  diamonds: "Karo",
  clubs: "Kreuz",
  spades: "Pik",
};

export const isRedSuit = (suit: Suit): boolean =>
  suit === "hearts" || suit === "diamonds";

export const rankLabel = (rank: Rank): string => {
  switch (rank) {
    case 11:
      return "J";
    case 12:
      return "Q";
    case 13:
      return "K";
    case 14:
      return "A";
    default:
      return String(rank);
  }
};

export const cardKey = (card: Card): string => `${card.suit}-${card.rank}`;

export const sortHand = (cards: Card[], trump: Suit): Card[] =>
  [...cards].sort((a, b) => {
    const at = a.suit === trump ? 1 : 0;
    const bt = b.suit === trump ? 1 : 0;
    if (at !== bt) return at - bt;
    if (a.suit !== b.suit) return a.suit.localeCompare(b.suit);
    return a.rank - b.rank;
  });
