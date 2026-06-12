import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";
import {
  isColorMode,
  isThemeId,
  type ColorMode,
  type ResolvedMode,
  type ThemeId,
} from "@/types/theme.type";

const THEME_KEY = "duraki-theme";
const MODE_KEY = "duraki-mode";

const DEFAULT_THEME: ThemeId = "violet-bloom";
const DEFAULT_MODE: ColorMode = "system";

const readTheme = (): ThemeId => {
  const stored = localStorage.getItem(THEME_KEY);
  return isThemeId(stored) ? stored : DEFAULT_THEME;
};

const readMode = (): ColorMode => {
  const stored = localStorage.getItem(MODE_KEY);
  return isColorMode(stored) ? stored : DEFAULT_MODE;
};

export const useThemeStore = defineStore("theme", () => {
  const media = window.matchMedia("(prefers-color-scheme: dark)");

  const themeId = ref<ThemeId>(readTheme());
  const mode = ref<ColorMode>(readMode());
  const systemPrefersDark = ref(media.matches);

  const resolvedMode = computed<ResolvedMode>(() =>
    mode.value === "system"
      ? systemPrefersDark.value
        ? "dark"
        : "light"
      : mode.value,
  );
  const isDark = computed(() => resolvedMode.value === "dark");

  const setTheme = (id: ThemeId): void => {
    themeId.value = id;
  };

  const setMode = (next: ColorMode): void => {
    mode.value = next;
  };

  const toggleMode = (): void => {
    mode.value = isDark.value ? "light" : "dark";
  };

  const syncThemeColor = (): void => {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (!meta) return;
    const probe = document.createElement("span");
    probe.style.cssText = "position:absolute;visibility:hidden;color:var(--background)";
    document.body.appendChild(probe);
    meta.content = getComputedStyle(probe).color;
    probe.remove();
  };

  const apply = (): void => {
    const el = document.documentElement;
    el.dataset.theme = themeId.value;
    el.dataset.mode = resolvedMode.value;
    el.classList.toggle("dark", isDark.value);
    if (document.body) syncThemeColor();
  };

  media.addEventListener("change", (event) => {
    systemPrefersDark.value = event.matches;
  });

  watch(
    [themeId, mode, resolvedMode],
    () => {
      localStorage.setItem(THEME_KEY, themeId.value);
      localStorage.setItem(MODE_KEY, mode.value);
      apply();
    },
    { immediate: true },
  );

  return {
    themeId,
    mode,
    resolvedMode,
    isDark,
    setTheme,
    setMode,
    toggleMode,
  };
});
