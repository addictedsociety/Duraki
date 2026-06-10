<script setup lang="ts"></script>

<template>
  <div
    class="relative h-full w-full overflow-hidden rounded-[8%] border shadow-md"
    :style="{
      borderColor: 'color-mix(in oklch, var(--card-back) 70%, black)',
      background:
        'repeating-linear-gradient(45deg, var(--card-back), var(--card-back) 6px, color-mix(in oklch, var(--card-back) 80%, black) 6px, color-mix(in oklch, var(--card-back) 80%, black) 12px)',
    }"
  >
    <div
      class="absolute inset-[10%] rounded-[8%] border-2 opacity-60"
      :style="{ borderColor: 'color-mix(in oklch, var(--card-back) 50%, white)' }"
    />
  </div>
</template>
