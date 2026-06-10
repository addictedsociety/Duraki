<script setup lang="ts">
import { computed } from "vue";
import { storeToRefs } from "pinia";
import type { Card as CardType } from "@/types/game.type";
import { useGameStore } from "@/stores/game";
import {
  canAttackCard,
  canDefendCard,
  canEndTurn,
  canTakeCards,
  canTransferAny,
  firstUndefendedIndex,
  transferCard,
} from "@/utils/legal";
import { cardKey } from "@/utils/cards";
import Card from "@/components/cards/Card.vue";
import NxrAvatar from "@/components/NxrAvatar.vue";
import Button from "@/components/ui/Button.vue";
import ActionBar from "./ActionBar.vue";
import ActionPopup from "./ActionPopup.vue";
import OpponentHand from "./OpponentHand.vue";
import PlayerHand from "./PlayerHand.vue";
import TableBackground from "./TableBackground.vue";
import TrumpDeck from "./TrumpDeck.vue";
import TurnStatus from "./TurnStatus.vue";

const {
  opponentName = "Gegner",
  opponentAvatar = null,
} = defineProps<{ opponentName?: string; opponentAvatar?: string | null }>();

const emit = defineEmits<{ leave: [] }>();

const game = useGameStore();
const { view, popup, isOver, winnerSeat } = storeToRefs(game);

const playableKeys = computed(() => {
  const set = new Set<string>();
  const v = view.value;
  if (!v || v.turn !== v.you || v.phase === "finished") return set;
  const target = firstUndefendedIndex(v);
  for (const card of v.hand) {
    if (v.phase === "attack" && canAttackCard(v, card)) set.add(cardKey(card));
    else if (v.phase === "defense" && target >= 0 && canDefendCard(v, card, target))
      set.add(cardKey(card));
  }
  return set;
});

const canEnd = computed(() => !!view.value && canEndTurn(view.value));
const canTake = computed(() => !!view.value && canTakeCards(view.value));
const canTransfer = computed(() => !!view.value && canTransferAny(view.value));

const resultText = computed(() => {
  if (winnerSeat.value === null) return "Unentschieden";
  return winnerSeat.value === view.value?.you
    ? "Du hast gewonnen!"
    : "Du bist der Durak!";
});

const onPlay = (card: CardType): void => {
  const v = view.value;
  if (!v) return;
  if (v.phase === "attack" && canAttackCard(v, card)) {
    void game.sendMove({ type: "ATTACK", seat: v.you, card });
  } else if (v.phase === "defense") {
    const target = firstUndefendedIndex(v);
    if (target >= 0 && canDefendCard(v, card, target)) {
      void game.sendMove({ type: "DEFEND", seat: v.you, card, targetIndex: target });
    }
  }
};

const onEnd = (): void => {
  if (view.value) void game.sendMove({ type: "END", seat: view.value.you });
};
const onTake = (): void => {
  if (view.value) void game.sendMove({ type: "TAKE", seat: view.value.you });
};
const onTransfer = (): void => {
  if (!view.value) return;
  const card = transferCard(view.value);
  if (card) void game.sendMove({ type: "TRANSFER", seat: view.value.you, card });
};
</script>

<template>
  <div
    class="relative flex h-[100dvh] flex-col overflow-hidden"
    :style="{
      background: 'radial-gradient(120% 80% at 50% 0%, var(--felt-from), var(--felt-to))',
    }"
  >
    <TableBackground class="z-0" />

    <template v-if="view">
      <!-- Opponent -->
      <header
        class="relative z-10 flex flex-col items-center gap-1 pt-3"
        :style="{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }"
      >
        <div class="flex items-center gap-2">
          <NxrAvatar :name="opponentName" :src="opponentAvatar" size="sm" />
          <span class="text-sm font-medium text-white/90">{{ opponentName }}</span>
        </div>
        <OpponentHand :count="view.opponentCardCount" />
      </header>

      <!-- Status + table -->
      <main class="relative z-10 flex flex-1 flex-col items-center justify-center gap-4 px-4">
        <TurnStatus :view="view" />

        <div class="absolute right-3 top-1/2 -translate-y-1/2">
          <TrumpDeck
            :trump-card="view.trumpCard"
            :deck-count="view.deckCount"
            :trump-suit="view.trumpSuit"
          />
        </div>

        <TransitionGroup
          name="card-pop"
          tag="div"
          class="flex min-h-28 flex-wrap items-center justify-center gap-3"
        >
          <div
            v-for="(pair, index) in view.table"
            :key="cardKey(pair.attack)"
            class="relative h-28 w-16"
          >
            <div class="absolute inset-0 w-16">
              <Card :card="pair.attack" />
            </div>
            <div
              v-if="pair.defense"
              :key="cardKey(pair.defense) + '-def'"
              class="absolute left-3 top-4 w-16"
            >
              <Card :card="pair.defense" />
            </div>
            <span
              v-else
              class="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs text-white/60"
            >
              {{ index + 1 }}
            </span>
          </div>
        </TransitionGroup>
      </main>

      <!-- Player -->
      <footer
        class="relative z-10 flex flex-col gap-3 pb-4"
        :style="{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }"
      >
        <ActionBar
          :can-end="canEnd"
          :can-take="canTake"
          :can-transfer="canTransfer"
          @end="onEnd"
          @take="onTake"
          @transfer="onTransfer"
          @leave="emit('leave')"
        />
        <PlayerHand
          :cards="view.hand"
          :trump-suit="view.trumpSuit"
          :playable-keys="playableKeys"
          @play="onPlay"
        />
      </footer>

      <ActionPopup :popup="popup" :you-seat="view.you" />

      <!-- Game over -->
      <Transition name="fade">
        <div
          v-if="isOver"
          class="absolute inset-0 z-40 flex flex-col items-center justify-center gap-6 bg-black/70 backdrop-blur-sm"
        >
          <h2 class="text-4xl font-black text-white" :style="{ textShadow: '0 0 22px var(--trump-glow)' }">
            {{ resultText }}
          </h2>
          <Button size="lg" @click="emit('leave')">Zurück zum Dashboard</Button>
        </div>
      </Transition>
    </template>

    <div v-else class="relative z-10 flex flex-1 items-center justify-center text-white/70">
      Spiel wird geladen ...
    </div>
  </div>
</template>
