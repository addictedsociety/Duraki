<script setup lang="ts">
import { computed } from "vue";
import Card from "@/components/cards/Card.vue";

const { count = 0 } = defineProps<{ count?: number }>();

const cards = computed(() => Array.from({ length: count }));
</script>

<template>
  <div class="flex h-20 items-center justify-center">
    <TransitionGroup name="card-pop" tag="div" class="flex items-center">
      <div
        v-for="(_, index) in cards"
        :key="index"
        class="-ml-6 w-12 first:ml-0"
        :style="{ transform: `rotate(${(index - (count - 1) / 2) * 4}deg)` }"
      >
        <Card face-down />
      </div>
    </TransitionGroup>
  </div>
</template>
