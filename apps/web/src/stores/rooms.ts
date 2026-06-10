import { defineStore } from "pinia";
import { ref } from "vue";
import type { RoomDto } from "@/types/game.type";
import { getSocket, request } from "@/services/socket.service";

export const useRoomsStore = defineStore("rooms", () => {
  const room = ref<RoomDto | null>(null);
  const pendingGameId = ref<string | null>(null);
  const isBusy = ref(false);
  const error = ref<string | null>(null);

  let bound = false;
  const bind = (): void => {
    if (bound) return;
    bound = true;
    const socket = getSocket();
    socket.on("room:update", (next) => {
      if (!room.value || next.id === room.value.id) room.value = next;
    });
    socket.on("room:closed", () => {
      room.value = null;
    });
    socket.on("game:started", ({ gameId }) => {
      pendingGameId.value = gameId;
    });
  };

  const wrap = async <T>(fn: () => Promise<T>): Promise<T | null> => {
    isBusy.value = true;
    error.value = null;
    try {
      return await fn();
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Fehler";
      return null;
    } finally {
      isBusy.value = false;
    }
  };

  const create = () =>
    wrap(async () => {
      bind();
      room.value = await request<RoomDto>("room:create");
      return room.value;
    });

  const join = (code: string) =>
    wrap(async () => {
      bind();
      room.value = await request<RoomDto>("room:join", { code });
      return room.value;
    });

  const setReady = (isReady: boolean) =>
    wrap(async () => {
      if (!room.value) return null;
      room.value = await request<RoomDto>("room:ready", {
        roomId: room.value.id,
        isReady,
      });
      return room.value;
    });

  const leave = () =>
    wrap(async () => {
      if (!room.value) return null;
      await request<null>("room:leave", { roomId: room.value.id });
      room.value = null;
      return null;
    });

  const start = () =>
    wrap(async () => {
      if (!room.value) return null;
      const res = await request<{ gameId: string }>("game:start", {
        roomId: room.value.id,
      });
      return res.gameId;
    });

  return {
    room,
    pendingGameId,
    isBusy,
    error,
    bind,
    create,
    join,
    setReady,
    leave,
    start,
  };
});
