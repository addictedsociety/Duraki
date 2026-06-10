import { getPlayerView } from "@duraki/game-core";
import type { PopupEvent } from "@duraki/shared";
import { socketsForUser } from "../lib/connections";
import { loadGame } from "../lib/game/persistence";
import type { AppServer } from "./types";

/** Push each player their own redacted view of the game. */
export const broadcastGameViews = async (
  io: AppServer,
  gameId: string,
): Promise<void> => {
  const game = await loadGame(gameId);
  for (const seat of [0, 1] as const) {
    const userId = game.users[seat];
    if (!userId) continue;
    const view = getPlayerView(game.state, seat);
    for (const socketId of socketsForUser(userId)) {
      io.to(socketId).emit("game:view", view);
    }
  }
};

export const emitPopupToUsers = (
  io: AppServer,
  users: readonly string[],
  popup: PopupEvent,
): void => {
  for (const userId of users) {
    for (const socketId of socketsForUser(userId)) {
      io.to(socketId).emit("game:popup", popup);
    }
  }
};
