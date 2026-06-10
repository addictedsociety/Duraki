import { defineStore } from "pinia";
import { ref } from "vue";
import type { PublicUser } from "@/types/game.type";

export const useAuthStore = defineStore("auth", () => {
  const me = ref<PublicUser | null>(null);
  const isReady = ref(false);

  const setMe = (user: PublicUser): void => {
    me.value = user;
    isReady.value = true;
  };

  const reset = (): void => {
    me.value = null;
    isReady.value = false;
  };

  return { me, isReady, setMe, reset };
});
