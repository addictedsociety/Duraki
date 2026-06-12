<script setup lang="ts">
import { computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { Check, Copy, LogOut, Play } from "@lucide/vue";
import { useAuthStore } from "@/stores/auth";
import { useRoomsStore } from "@/stores/rooms";
import Badge from "@/components/ui/Badge.vue";
import Button from "@/components/ui/Button.vue";
import Card from "@/components/ui/Card.vue";
import NxrAvatar from "@/components/NxrAvatar.vue";

const router = useRouter();
const rooms = useRoomsStore();
const auth = useAuthStore();

const me = computed(
  () => rooms.room?.members.find((member) => member.id === auth.me?.id) ?? null,
);
const isHost = computed(() => me.value?.isHost ?? false);
const canStart = computed(
  () =>
    !!rooms.room &&
    rooms.room.members.length === 2 &&
    rooms.room.members.every((member) => member.isReady) &&
    isHost.value,
);

const toggleReady = (): void => {
  void rooms.setReady(!me.value?.isReady);
};

const start = async (): Promise<void> => {
  const gameId = await rooms.start();
  if (gameId) router.replace(`/game/${gameId}`);
};

const leave = async (): Promise<void> => {
  await rooms.leave();
  router.replace("/dashboard");
};

const copyCode = (): void => {
  if (rooms.room) void navigator.clipboard?.writeText(rooms.room.code);
};

onMounted(() => {
  if (!rooms.room) router.replace("/dashboard");
});

watch(
  () => rooms.pendingGameId,
  (gameId) => {
    if (gameId) router.replace(`/game/${gameId}`);
  },
);

watch(
  () => rooms.room,
  (room) => {
    if (!room) router.replace("/dashboard");
  },
);
</script>

<template>
  <div
    v-if="rooms.room"
    class="mx-auto flex min-h-[100dvh] max-w-xl flex-col gap-6 px-4 pb-12 pt-6"
  >
    <header class="flex items-center justify-between">
      <h1 class="text-xl font-black">Spielraum</h1>
      <Button variant="ghost" size="sm" @click="leave">
        <LogOut class="size-4" /> Verlassen
      </Button>
    </header>

    <Card class="flex flex-col items-center gap-2 p-6">
      <span class="text-sm text-muted-foreground">Einladungscode</span>
      <button
        type="button"
        class="flex items-center gap-3 text-3xl font-black tracking-[0.2em] sm:text-4xl sm:tracking-[0.3em]"
        @click="copyCode"
      >
        {{ rooms.room.code }}
        <Copy class="size-5 text-muted-foreground" />
      </button>
      <span class="text-xs text-muted-foreground">Tippen zum Kopieren</span>
    </Card>

    <section class="flex flex-col gap-2">
      <h2 class="text-sm font-semibold text-muted-foreground">Spieler</h2>
      <Card
        v-for="member in rooms.room.members"
        :key="member.id"
        class="flex items-center gap-3 p-3"
      >
        <NxrAvatar :name="member.name" :src="member.avatarUrl" />
        <div class="flex min-w-0 flex-1 flex-col">
          <span class="truncate font-medium">{{ member.name }}</span>
          <span v-if="member.isHost" class="text-xs text-muted-foreground">Host</span>
        </div>
        <Badge :variant="member.isReady ? 'success' : 'secondary'">
          {{ member.isReady ? "Bereit" : "Wartet" }}
        </Badge>
      </Card>
      <Card
        v-if="rooms.room.members.length < 2"
        class="flex items-center justify-center p-4 text-sm text-muted-foreground"
      >
        Warte auf Mitspieler ...
      </Card>
    </section>

    <div class="mt-auto flex flex-col gap-2">
      <Button variant="secondary" @click="toggleReady">
        <Check class="size-4" />
        {{ me?.isReady ? "Nicht mehr bereit" : "Bereit" }}
      </Button>
      <Button v-if="isHost" :disabled="!canStart" size="lg" @click="start">
        <Play class="size-5" />
        Spiel starten
      </Button>
    </div>
  </div>
</template>
