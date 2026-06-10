<script setup lang="ts">
import type { Card } from "@/types/game.type";
import CardBack from "./CardBack.vue";
import CardFace from "./CardFace.vue";

const { card = null, faceDown = false } = defineProps<{
  card?: Card | null;
  faceDown?: boolean;
}>();
</script>

<template>
  <!-- container query unit (cqw) sizing relies on the wrapper width -->
  <div class="card-root relative aspect-[5/7] w-full [container-type:inline-size]">
    <CardBack v-if="faceDown || !card" />
    <CardFace v-else :card="card" />
  </div>
</template>
