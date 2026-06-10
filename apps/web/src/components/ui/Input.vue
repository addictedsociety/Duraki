<script setup lang="ts">
import { cn } from "@/lib/utils";

const { class: className = "", placeholder = "" } = defineProps<{
  class?: string;
  placeholder?: string;
}>();

const model = defineModel<string>();
</script>

<template>
  <input
    v-model="model"
    :placeholder="placeholder"
    :class="
      cn(
        'flex h-11 w-full rounded-lg border border-input bg-transparent px-3 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )
    "
  />
</template>
