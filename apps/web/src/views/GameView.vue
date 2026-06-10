<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useGameStore } from "@/stores/game";
import { useRoomsStore } from "@/stores/rooms";
import GameBoard from "@/components/game/GameBoard.vue";

const { gameId } = defineProps<{ gameId: string }>();

const router = useRouter();
const game = useGameStore();
const rooms = useRoomsStore();
const auth = useAuthStore();

const opponent = computed(
  () => rooms.room?.members.find((member) => member.id !== auth.me?.id) ?? null,
);

const onLeave = (): void => {
  game.reset();
  router.replace("/dashboard");
};

onMounted(() => {
  void game.sync(gameId);
});
</script>

<template>
  <GameBoard
    :opponent-name="opponent?.name ?? 'Gegner'"
    :opponent-avatar="opponent?.avatarUrl ?? null"
    @leave="onLeave"
  />
</template>
