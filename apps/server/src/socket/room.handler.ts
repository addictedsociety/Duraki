import {
  createRoom,
  getRoomDto,
  joinRoom,
  leaveRoom,
  setReady,
} from "../services/room.service";
import { createGameForRoom } from "../lib/game/persistence";
import { broadcastGameViews } from "./emit";
import { roomChannel, type AppServer, type AppSocket } from "./types";

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "Unbekannter Fehler";

export const registerRoomHandlers = (io: AppServer, socket: AppSocket): void => {
  const userId = socket.data.userId;

  socket.on("room:create", async (cb) => {
    try {
      const room = await createRoom(userId);
      await socket.join(roomChannel(room.id));
      cb({ ok: true, data: room });
    } catch (error) {
      cb({ ok: false, error: errorMessage(error) });
    }
  });

  socket.on("room:join", async ({ code }, cb) => {
    try {
      const room = await joinRoom(userId, code);
      await socket.join(roomChannel(room.id));
      io.to(roomChannel(room.id)).emit("room:update", room);
      cb({ ok: true, data: room });
    } catch (error) {
      cb({ ok: false, error: errorMessage(error) });
    }
  });

  socket.on("room:ready", async ({ roomId, isReady }, cb) => {
    try {
      const room = await setReady(userId, roomId, isReady);
      io.to(roomChannel(roomId)).emit("room:update", room);
      cb({ ok: true, data: room });
    } catch (error) {
      cb({ ok: false, error: errorMessage(error) });
    }
  });

  socket.on("room:leave", async ({ roomId }, cb) => {
    try {
      await leaveRoom(userId, roomId);
      await socket.leave(roomChannel(roomId));
      io.to(roomChannel(roomId)).emit("room:closed", { roomId });
      cb({ ok: true, data: null });
    } catch (error) {
      cb({ ok: false, error: errorMessage(error) });
    }
  });

  socket.on("game:start", async ({ roomId }, cb) => {
    try {
      const room = await getRoomDto(roomId);
      const host = room.members.find((m) => m.isHost);
      if (!host || host.id !== userId) {
        throw new Error("Nur der Host kann das Spiel starten");
      }
      if (room.members.length !== 2 || !room.members.every((m) => m.isReady)) {
        throw new Error("Beide Spieler muessen bereit sein");
      }

      const gameId = await createGameForRoom(roomId);
      io.to(roomChannel(roomId)).emit("game:started", { gameId });
      await broadcastGameViews(io, gameId);
      cb({ ok: true, data: { gameId } });
    } catch (error) {
      cb({ ok: false, error: errorMessage(error) });
    }
  });
};
