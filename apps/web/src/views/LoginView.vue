<script setup lang="ts">
import { SignInButton } from "@clerk/vue";
import { Spade } from "@lucide/vue";
import Button from "@/components/ui/Button.vue";
</script>

<template>
  <div
    class="flex h-[100dvh] flex-col items-center justify-center gap-10 px-6 text-center"
    :style="{
      background: 'radial-gradient(120% 90% at 50% 0%, var(--felt-from), var(--felt-to))',
    }"
  >
    <div class="flex flex-col items-center gap-4">
      <div
        class="flex size-20 items-center justify-center rounded-3xl bg-white/10 backdrop-blur"
        :style="{ boxShadow: '0 0 40px var(--trump-glow)' }"
      >
        <Spade class="size-10 text-white" />
      </div>
      <h1 class="text-5xl font-black tracking-tight text-white">Duraki</h1>
      <p class="max-w-xs text-balance text-white/70">
        Das russische Kartenspiel Durak - modern, mobil und zu zweit spielbar.
      </p>
    </div>

    <SignInButton mode="modal" force-redirect-url="/dashboard">
      <Button size="lg" class="w-full max-w-xs">Mit Google anmelden</Button>
    </SignInButton>
  </div>
</template>
