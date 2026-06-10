<script setup lang="ts">
import { computed } from "vue";
import type { Card } from "@/types/game.type";
import { SUIT_SYMBOL, isRedSuit, rankLabel } from "@/utils/cards";

const { card } = defineProps<{ card: Card }>();

const color = computed(() =>
  isRedSuit(card.suit) ? "var(--suit-red)" : "var(--suit-black)",
);
const symbol = computed(() => SUIT_SYMBOL[card.suit]);
const label = computed(() => rankLabel(card.rank));
</script>

<template>
  <div
    class="relative flex h-full w-full flex-col justify-between overflow-hidden rounded-[8%] border p-[6%] shadow-md"
    :style="{
      background:
        'linear-gradient(160deg, var(--card-face), color-mix(in oklch, var(--card-face) 88%, var(--card-edge)))',
      borderColor: 'var(--card-edge)',
      color,
    }"
  >
    <div class="flex flex-col items-center leading-none">
      <span class="text-[26cqw] font-bold">{{ label }}</span>
      <span class="text-[20cqw] leading-none">{{ symbol }}</span>
    </div>
    <span
      class="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[58cqw] opacity-90"
    >
      {{ symbol }}
    </span>
    <div class="flex rotate-180 flex-col items-center leading-none">
      <span class="text-[26cqw] font-bold">{{ label }}</span>
      <span class="text-[20cqw] leading-none">{{ symbol }}</span>
    </div>
  </div>
</template>
