import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { Action, PlayerView, PopupEvent, Seat } from "@/types/game.type";
import { getSocket, request } from "@/services/socket.service";

export const useGameStore = defineStore("game", () => {
  const view = ref<PlayerView | null>(null);
  const popup = ref<PopupEvent | null>(null);
  const gameId = ref<string | null>(null);
  const isOver = ref(false);
  const winnerSeat = ref<Seat | null>(null);

  const isYourTurn = computed(
    () => !!view.value && view.value.turn === view.value.you && !isOver.value,
  );

  let popupTimer: ReturnType<typeof setTimeout> | undefined;
  const flashPopup = (event: PopupEvent): void => {
    popup.value = event;
    clearTimeout(popupTimer);
    popupTimer = setTimeout(() => {
      popup.value = null;
    }, 1500);
  };

  let bound = false;
  const bind = (): void => {
    if (bound) return;
    bound = true;
    const socket = getSocket();
    socket.on("game:view", (next) => {
      view.value = next;
      if (next.phase === "finished") {
        isOver.value = true;
        winnerSeat.value = next.winner;
      }
    });
    socket.on("game:popup", (event) => flashPopup(event));
    socket.on("game:over", ({ winnerSeat: seat }) => {
      isOver.value = true;
      winnerSeat.value = seat;
    });
  };

  const sync = async (id: string): Promise<void> => {
    bind();
    gameId.value = id;
    isOver.value = false;
    view.value = await request<PlayerView>("game:sync", { gameId: id });
    if (view.value.phase === "finished") {
      isOver.value = true;
      winnerSeat.value = view.value.winner;
    }
  };

  const sendMove = async (action: Action): Promise<void> => {
    if (!gameId.value) return;
    await request<null>("game:move", { gameId: gameId.value, action });
  };

  const reset = (): void => {
    view.value = null;
    popup.value = null;
    gameId.value = null;
    isOver.value = false;
    winnerSeat.value = null;
  };

  return {
    view,
    popup,
    gameId,
    isOver,
    winnerSeat,
    isYourTurn,
    bind,
    sync,
    sendMove,
    reset,
  };
});
