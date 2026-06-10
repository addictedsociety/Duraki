<script setup lang="ts">
import type { Card as CardType, Suit } from "@/types/game.type";
import Card from "@/components/cards/Card.vue";
import { SUIT_SYMBOL } from "@/utils/cards";

const { trumpCard = null, deckCount = 0, trumpSuit } = defineProps<{
  trumpCard?: CardType | null;
  deckCount?: number;
  trumpSuit: Suit;
}>();
</script>

<template>
  <div class="flex flex-col items-center gap-1">
    <div class="relative h-24 w-16">
      <!-- trump card lying under the deck (rotated) -->
      <div
        v-if="trumpCard"
        class="absolute left-3 top-3 w-14 rotate-90"
        :style="{ filter: 'drop-shadow(0 0 6px var(--trump-glow))' }"
      >
        <Card :card="trumpCard" />
      </div>
      <div v-if="deckCount > 1" class="absolute left-0 top-0 w-14">
        <Card face-down />
      </div>
    </div>
    <div class="flex items-center gap-1 text-xs text-muted-foreground">
      <span>Stapel {{ deckCount }}</span>
      <span class="text-foreground">{{ SUIT_SYMBOL[trumpSuit] }}</span>
    </div>
  </div>
</template>
