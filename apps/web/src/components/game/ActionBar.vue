<script setup lang="ts">
import { Check, Hand, LogOut, Share2 } from "@lucide/vue";
import Button from "@/components/ui/Button.vue";

const {
  canEnd = false,
  canTake = false,
  canTransfer = false,
} = defineProps<{
  canEnd?: boolean;
  canTake?: boolean;
  canTransfer?: boolean;
}>();

const emit = defineEmits<{
  end: [];
  take: [];
  transfer: [];
  leave: [];
}>();
</script>

<template>
  <div class="flex items-center justify-center gap-2 px-4">
    <Button variant="outline" size="sm" @click="emit('leave')">
      <LogOut class="size-4" />
      Verlassen
    </Button>
    <Button v-if="canTransfer" variant="secondary" @click="emit('transfer')">
      <Share2 class="size-4" />
      Schieben
    </Button>
    <Button
      v-if="canTake"
      variant="destructive"
      @click="emit('take')"
    >
      <Hand class="size-4" />
      Aufnehmen
    </Button>
    <Button v-if="canEnd" @click="emit('end')">
      <Check class="size-4" />
      Fertig
    </Button>
  </div>
</template>
