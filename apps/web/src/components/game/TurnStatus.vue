<script setup lang="ts">
import { computed } from "vue";
import type { PlayerView } from "@/types/game.type";
import Badge from "@/components/ui/Badge.vue";

const { view } = defineProps<{ view: PlayerView }>();

const isYou = computed(() => view.turn === view.you);

const phaseLabel = computed(() => {
  switch (view.phase) {
    case "defense":
      return "Verteidigung";
    case "taking":
      return "Aufnehmen";
    default:
      return "Angriff";
  }
});

const statusLabel = computed(() => {
  if (view.phase === "finished") return "Spiel beendet";
  if (view.phase === "taking") {
    return view.you === view.attacker ? "Wirf Karten nach" : "Gegner nimmt auf";
  }
  if (view.you === view.attacker) {
    return view.phase === "attack" ? "Du greifst an" : "Gegner verteidigt";
  }
  return view.phase === "defense" ? "Du verteidigst" : "Gegner greift an";
});
</script>

<template>
  <div class="flex items-center justify-center gap-2">
    <Badge :variant="isYou ? 'default' : 'secondary'">{{ statusLabel }}</Badge>
    <Badge variant="outline">{{ phaseLabel }}</Badge>
  </div>
</template>
