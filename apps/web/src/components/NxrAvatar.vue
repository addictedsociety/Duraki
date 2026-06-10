<script setup lang="ts">
import { computed } from "vue";
import { cn } from "@/lib/utils";

const {
  name = "",
  src = null,
  size = "md",
  class: className = "",
} = defineProps<{
  name?: string;
  src?: string | null;
  size?: "sm" | "md" | "lg";
  class?: string;
}>();

const initials = computed(() =>
  name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase(),
);

const sizeClass = computed(
  () =>
    ({ sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-14 w-14 text-lg" })[
      size
    ],
);
</script>

<template>
  <div
    :class="
      cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary font-semibold text-secondary-foreground ring-2 ring-border',
        sizeClass,
        className,
      )
    "
  >
    <img v-if="src" :src="src" :alt="name" class="h-full w-full object-cover" />
    <span v-else>{{ initials || "?" }}</span>
  </div>
</template>
