import { beats } from "@duraki/game-core";
import type { Card, PlayerView } from "@/types/game.type";

export const isYourTurn = (view: PlayerView): boolean => view.turn === view.you;

const ranksOnTable = (view: PlayerView): Set<number> => {
  const ranks = new Set<number>();
  for (const pair of view.table) {
    ranks.add(pair.attack.rank);
    if (pair.defense) ranks.add(pair.defense.rank);
  }
  return ranks;
};

export const canAttackCard = (view: PlayerView, card: Card): boolean => {
  if (view.you !== view.attacker) return false;
  if (view.phase !== "attack" && view.phase !== "taking") return false;
  if (view.table.length >= 6) return false;
  if (view.phase === "attack" && view.opponentCardCount <= 0) return false;
  if (view.table.length === 0) return view.phase === "attack";
  return ranksOnTable(view).has(card.rank);
};

export const canTransferCard = (view: PlayerView, card: Card): boolean => {
  if (view.phase !== "defense" || view.you !== view.defender) return false;
  if (view.table.length === 0 || view.table.length >= 6) return false;
  if (view.table.some((pair) => pair.defense)) return false;
  if (view.table.some((pair) => pair.attack.rank !== card.rank)) return false;
  return view.opponentCardCount >= view.table.length + 1;
};

export const canTransferAny = (view: PlayerView): boolean =>
  view.hand.some((card) => canTransferCard(view, card));

/** Lowest eligible transfer card (prefer non-trump to keep trumps in hand). */
export const transferCard = (view: PlayerView): Card | null => {
  const eligible = view.hand.filter((card) => canTransferCard(view, card));
  if (eligible.length === 0) return null;
  return eligible.sort((a, b) => {
    const at = a.suit === view.trumpSuit ? 1 : 0;
    const bt = b.suit === view.trumpSuit ? 1 : 0;
    return at - bt;
  })[0];
};

export const firstUndefendedIndex = (view: PlayerView): number =>
  view.table.findIndex((pair) => !pair.defense);

export const canDefendCard = (
  view: PlayerView,
  card: Card,
  targetIndex: number,
): boolean => {
  const pair = view.table[targetIndex];
  if (!pair || pair.defense) return false;
  return (
    view.phase === "defense" &&
    view.you === view.defender &&
    beats(card, pair.attack, view.trumpSuit)
  );
};

export const canEndTurn = (view: PlayerView): boolean => {
  if (view.you !== view.attacker) return false;
  if (view.phase === "taking") return true;
  return (
    view.phase === "attack" &&
    view.table.length > 0 &&
    view.table.every((pair) => pair.defense)
  );
};

export const canTakeCards = (view: PlayerView): boolean =>
  view.phase === "defense" &&
  view.you === view.defender &&
  view.table.length > 0;
