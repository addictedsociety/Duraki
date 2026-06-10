<script setup lang="ts">
import {
  PopoverContent,
  PopoverPortal,
  PopoverRoot,
  PopoverTrigger,
} from "reka-ui";
import { Palette } from "@lucide/vue";
import { THEMES } from "@/types/theme.type";
import { useThemeStore } from "@/stores/theme";
import { cn } from "@/lib/utils";

const theme = useThemeStore();
</script>

<template>
  <PopoverRoot>
    <PopoverTrigger
      class="flex size-9 items-center justify-center rounded-lg border border-border text-foreground transition-colors hover:bg-accent"
      aria-label="Theme wählen"
    >
      <Palette class="size-4" />
    </PopoverTrigger>
    <PopoverPortal>
      <PopoverContent
        :side-offset="8"
        align="end"
        class="z-50 flex flex-col gap-1 rounded-xl border border-border bg-popover p-2 text-popover-foreground shadow-xl"
      >
        <button
          v-for="option in THEMES"
          :key="option.id"
          type="button"
          class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent"
          :class="cn(theme.themeId === option.id && 'bg-accent')"
          @click="theme.setTheme(option.id)"
        >
          <span
            class="size-4 rounded-full ring-1 ring-border"
            :style="{ backgroundColor: option.swatch }"
          />
          {{ option.name }}
        </button>
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>
