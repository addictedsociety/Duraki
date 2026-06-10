import { getPlayerView } from "@duraki/game-core";
import type { PopupKind } from "@duraki/shared";
import { socketsForUser } from "../lib/connections";
import { applyAction, loadGame, seatOfUser } from "../lib/game/persistence";
import { broadcastGameViews, emitPopupToUsers } from "./emit";
import type { AppServer, AppSocket } from "./types";

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "Unbekannter Fehler";

const popupForAction = (type: string): PopupKind | null => {
  switch (type) {
    case "ATTACK":
      return "attack";
    case "DEFEND":
      return "defended";
    case "TAKE":
      return "taken";
    case "TRANSFER":
      return "pushed";
    default:
      return null;
  }
};

export const registerGameHandlers = (io: AppServer, socket: AppSocket): void => {
  const userId = socket.data.userId;

  socket.on("game:move", async ({ gameId, action }, cb) => {
    try {
      const { state, finished, game } = await applyAction(gameId, userId, action);

      const actorSeat = seatOfUser(game, userId);
      const popupKind = popupForAction(action.type);
      if (popupKind && actorSeat !== null) {
        emitPopupToUsers(io, game.users, { kind: popupKind, seat: actorSeat });
      }

      await broadcastGameViews(io, gameId);

      if (finished) {
        if (state.winner !== null) {
          emitPopupToUsers(io, game.users, { kind: "won", seat: state.winner });
        }
        if (state.loser !== null) {
          emitPopupToUsers(io, game.users, { kind: "durak", seat: state.loser });
        }
        for (const gameUserId of game.users) {
          if (!gameUserId) continue;
          for (const socketId of socketsForUser(gameUserId)) {
            io.to(socketId).emit("game:over", { gameId, winnerSeat: state.winner });
          }
        }
      }

      cb({ ok: true, data: null });
    } catch (error) {
      cb({ ok: false, error: errorMessage(error) });
    }
  });

  socket.on("game:sync", async ({ gameId }, cb) => {
    try {
      const game = await loadGame(gameId);
      const seat = seatOfUser(game, userId);
      if (seat === null) throw new Error("Kein Teilnehmer dieses Spiels");
      cb({ ok: true, data: getPlayerView(game.state, seat) });
    } catch (error) {
      cb({ ok: false, error: errorMessage(error) });
    }
  });
};
