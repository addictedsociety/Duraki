<script setup lang="ts">
import { computed } from "vue";
import type { Card as CardType, Suit } from "@/types/game.type";
import Card from "@/components/cards/Card.vue";
import { cardKey, sortHand } from "@/utils/cards";

const { cards, trumpSuit, playableKeys } = defineProps<{
  cards: CardType[];
  trumpSuit: Suit;
  playableKeys: Set<string>;
}>();

const emit = defineEmits<{
  play: [card: CardType];
}>();

const sorted = computed(() => sortHand(cards, trumpSuit));

const onPlay = (card: CardType): void => {
  if (playableKeys.has(cardKey(card))) emit("play", card);
};
</script>

<template>
  <div class="flex items-end justify-center overflow-x-auto px-4 pb-2">
    <TransitionGroup name="card-pop" tag="div" class="flex items-end">
      <button
        v-for="card in sorted"
        :key="cardKey(card)"
        type="button"
        class="-ml-4 w-[18vw] max-w-20 origin-bottom transition-transform duration-200 first:ml-0"
        :class="
          playableKeys.has(cardKey(card))
            ? 'cursor-pointer hover:-translate-y-3'
            : 'opacity-60'
        "
        :style="
          playableKeys.has(cardKey(card))
            ? { filter: 'drop-shadow(0 0 4px var(--ring))' }
            : undefined
        "
        @click="onPlay(card)"
      >
        <Card :card="card" />
      </button>
    </TransitionGroup>
  </div>
</template>
