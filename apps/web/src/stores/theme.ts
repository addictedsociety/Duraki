import { defineStore } from "pinia";
import { ref, watch } from "vue";
import type { ThemeId } from "@/types/theme.type";

const STORAGE_KEY = "duraki-theme";

export const useThemeStore = defineStore("theme", () => {
  const themeId = ref<ThemeId>(
    (localStorage.getItem(STORAGE_KEY) as ThemeId | null) ?? "default",
  );

  const setTheme = (id: ThemeId): void => {
    themeId.value = id;
  };

  watch(
    themeId,
    (value) => {
      localStorage.setItem(STORAGE_KEY, value);
      document.documentElement.dataset.theme = value;
      document.documentElement.classList.add("dark");
    },
    { immediate: true },
  );

  return { themeId, setTheme };
});
