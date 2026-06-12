<script setup lang="ts">
import {
  PopoverContent,
  PopoverPortal,
  PopoverRoot,
  PopoverTrigger,
} from "reka-ui";
import { Check, Monitor, Moon, Palette, Sun } from "@lucide/vue";
import type { ColorMode } from "@/types/theme.type";
import { THEMES } from "@/types/theme.type";
import { useThemeStore } from "@/stores/theme";
import { cn } from "@/lib/utils";

const theme = useThemeStore();

const modes: { id: ColorMode; label: string; icon: typeof Sun }[] = [
  { id: "light", label: "Hell", icon: Sun },
  { id: "dark", label: "Dunkel", icon: Moon },
  { id: "system", label: "System", icon: Monitor },
];
</script>

<template>
  <PopoverRoot>
    <PopoverTrigger
      class="flex size-10 items-center justify-center rounded-lg border border-border text-foreground transition-colors hover:bg-accent"
      aria-label="Darstellung wählen"
    >
      <Palette class="size-5" />
    </PopoverTrigger>
    <PopoverPortal>
      <PopoverContent
        :side-offset="8"
        align="end"
        class="z-50 flex w-[min(20rem,calc(100vw-1.5rem))] flex-col gap-4 rounded-xl border border-border bg-popover p-4 text-popover-foreground shadow-xl"
      >
        <div class="flex flex-col gap-2">
          <span class="text-xs font-semibold text-muted-foreground">Modus</span>
          <div class="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1">
            <button
              v-for="option in modes"
              :key="option.id"
              type="button"
              class="flex h-10 items-center justify-center gap-1.5 rounded-md text-sm font-medium transition-colors"
              :class="
                cn(
                  theme.mode === option.id
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )
              "
              @click="theme.setMode(option.id)"
            >
              <component :is="option.icon" class="size-4" />
              {{ option.label }}
            </button>
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <span class="text-xs font-semibold text-muted-foreground">Theme</span>
          <div class="grid grid-cols-2 gap-1">
            <button
              v-for="option in THEMES"
              :key="option.id"
              type="button"
              class="flex h-11 items-center gap-2.5 rounded-lg px-3 text-sm transition-colors hover:bg-accent"
              :class="cn(theme.themeId === option.id && 'bg-accent')"
              @click="theme.setTheme(option.id)"
            >
              <span
                class="size-4 shrink-0 rounded-full ring-1 ring-border"
                :style="{ backgroundColor: option.swatch }"
              />
              <span class="flex-1 truncate text-left">{{ option.name }}</span>
              <Check
                v-if="theme.themeId === option.id"
                class="size-4 shrink-0 text-primary"
              />
            </button>
          </div>
        </div>
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>
