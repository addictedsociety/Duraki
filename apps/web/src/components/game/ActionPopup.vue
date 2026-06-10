<script setup lang="ts">
import { computed } from "vue";
import type { PopupEvent, Seat } from "@/types/game.type";

const { popup = null, youSeat } = defineProps<{
  popup?: PopupEvent | null;
  youSeat: Seat;
}>();

const text = computed<string | null>(() => {
  if (!popup) return null;
  switch (popup.kind) {
    case "attack":
      return "Angriff!";
    case "defended":
      return "Verteidigt!";
    case "pushed":
      return "Geschoben!";
    case "taken":
      return "Aufgenommen!";
    case "won":
      return popup.seat === youSeat ? "Gewonnen!" : null;
    case "durak":
      return popup.seat === youSeat ? "Durak!" : "Gewonnen!";
    default:
      return null;
  }
});
</script>

<template>
  <Transition name="popup">
    <div
      v-if="text"
      class="pointer-events-none absolute inset-0 z-30 flex items-center justify-center"
    >
      <span
        class="rounded-2xl bg-black/60 px-8 py-4 text-3xl font-black uppercase tracking-wider text-white backdrop-blur-sm"
        :style="{ textShadow: '0 0 18px var(--trump-glow)' }"
      >
        {{ text }}
      </span>
    </div>
  </Transition>
</template>
