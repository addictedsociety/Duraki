<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { UserButton } from "@clerk/vue";
import { LogIn, Plus, Swords, Trophy } from "@lucide/vue";
import type { DashboardDto } from "@/types/game.type";
import { fetchDashboard } from "@/services/api.service";
import { useRoomsStore } from "@/stores/rooms";
import Button from "@/components/ui/Button.vue";
import Card from "@/components/ui/Card.vue";
import Badge from "@/components/ui/Badge.vue";
import Input from "@/components/ui/Input.vue";
import NxrAvatar from "@/components/NxrAvatar.vue";
import ThemeSwitcher from "@/components/ThemeSwitcher.vue";

const router = useRouter();
const rooms = useRoomsStore();

const dashboard = ref<DashboardDto | null>(null);
const isLoading = ref(true);
const loadError = ref<string | null>(null);
const joinCode = ref("");

const load = async (): Promise<void> => {
  isLoading.value = true;
  loadError.value = null;
  try {
    dashboard.value = await fetchDashboard();
  } catch {
    loadError.value = "Statistiken konnten nicht geladen werden.";
  } finally {
    isLoading.value = false;
  }
};

const onCreate = async (): Promise<void> => {
  const room = await rooms.create();
  if (room) router.push("/room");
};

const onJoin = async (): Promise<void> => {
  if (!joinCode.value.trim()) return;
  const room = await rooms.join(joinCode.value.trim());
  if (room) router.push("/room");
};

const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });

onMounted(load);
</script>

<template>
  <div class="mx-auto flex min-h-[100dvh] max-w-xl flex-col gap-6 px-4 pb-12 pt-6">
    <header class="flex items-center justify-between">
      <h1 class="text-2xl font-black">Duraki</h1>
      <div class="flex items-center gap-2">
        <ThemeSwitcher />
        <UserButton />
      </div>
    </header>

    <!-- Play actions -->
    <Card class="flex flex-col gap-3 p-4">
      <Button size="lg" :disabled="rooms.isBusy" @click="onCreate">
        <Plus class="size-5" />
        Neues Spiel erstellen
      </Button>
      <div class="flex gap-2">
        <Input v-model="joinCode" placeholder="Einladungscode" class="uppercase" />
        <Button variant="secondary" :disabled="rooms.isBusy" @click="onJoin">
          <LogIn class="size-4" />
          Beitreten
        </Button>
      </div>
      <p v-if="rooms.error" class="text-sm text-destructive">{{ rooms.error }}</p>
    </Card>

    <!-- Stats -->
    <section class="grid grid-cols-4 gap-2">
      <Card class="flex flex-col items-center gap-1 p-3">
        <span class="text-2xl font-black">{{ dashboard?.stats.gamesPlayed ?? 0 }}</span>
        <span class="text-xs text-muted-foreground">Spiele</span>
      </Card>
      <Card class="flex flex-col items-center gap-1 p-3">
        <span class="text-2xl font-black text-emerald-400">{{ dashboard?.stats.wins ?? 0 }}</span>
        <span class="text-xs text-muted-foreground">Siege</span>
      </Card>
      <Card class="flex flex-col items-center gap-1 p-3">
        <span class="text-2xl font-black text-destructive">{{ dashboard?.stats.losses ?? 0 }}</span>
        <span class="text-xs text-muted-foreground">Niederl.</span>
      </Card>
      <Card class="flex flex-col items-center gap-1 p-3">
        <span class="text-2xl font-black text-primary">{{ dashboard?.stats.winrate ?? 0 }}%</span>
        <span class="text-xs text-muted-foreground">Winrate</span>
      </Card>
    </section>

    <!-- Opponents -->
    <section class="flex flex-col gap-2">
      <h2 class="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        <Swords class="size-4" /> Gegner
      </h2>
      <Card v-if="!dashboard?.opponents.length" class="p-4 text-sm text-muted-foreground">
        Noch keine Gegner. Erstelle ein Spiel und lade jemanden ein.
      </Card>
      <Card
        v-for="opponent in dashboard?.opponents"
        :key="opponent.id"
        class="flex items-center gap-3 p-3"
      >
        <NxrAvatar :name="opponent.name" :src="opponent.avatarUrl" size="sm" />
        <div class="flex flex-1 flex-col">
          <span class="font-medium">{{ opponent.name }}</span>
          <span class="text-xs text-muted-foreground">{{ opponent.gamesPlayed }} Spiele</span>
        </div>
        <Badge variant="success">{{ opponent.wins }}S</Badge>
        <Badge variant="destructive">{{ opponent.losses }}N</Badge>
      </Card>
    </section>

    <!-- History -->
    <section class="flex flex-col gap-2">
      <h2 class="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        <Trophy class="size-4" /> Verlauf
      </h2>
      <p v-if="loadError" class="text-sm text-destructive">{{ loadError }}</p>
      <Card v-if="!isLoading && !dashboard?.history.length" class="p-4 text-sm text-muted-foreground">
        Noch keine Spiele gespielt.
      </Card>
      <Card
        v-for="entry in dashboard?.history"
        :key="entry.id"
        class="flex items-center gap-3 p-3"
      >
        <NxrAvatar
          :name="entry.opponents[0]?.name ?? '?'"
          :src="entry.opponents[0]?.avatarUrl ?? null"
          size="sm"
        />
        <div class="flex flex-1 flex-col">
          <span class="font-medium">{{ entry.opponents[0]?.name ?? "Unbekannt" }}</span>
          <span class="text-xs text-muted-foreground">{{ formatDate(entry.startedAt) }}</span>
        </div>
        <Badge v-if="entry.result === 'WIN'" variant="success">Sieg</Badge>
        <Badge v-else-if="entry.result === 'LOSS'" variant="destructive">Durak</Badge>
        <Badge v-else-if="entry.result === 'DRAW'" variant="outline">Remis</Badge>
        <Badge v-else variant="secondary">Läuft</Badge>
      </Card>
    </section>
  </div>
</template>
