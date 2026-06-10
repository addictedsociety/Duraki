<script setup lang="ts">
import { watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuth } from "@clerk/vue";
import { fetchMe } from "@/services/api.service";
import { connectSocket, disconnectSocket } from "@/services/socket.service";
import { setTokenGetter } from "@/services/token";
import { useAuthStore } from "@/stores/auth";
import { useThemeStore } from "@/stores/theme";

const router = useRouter();
const route = useRoute();
const { isLoaded, isSignedIn, getToken } = useAuth();
const authStore = useAuthStore();

useThemeStore();

watch(
  [isLoaded, isSignedIn],
  async ([loaded, signedIn]) => {
    if (!loaded) return;
    if (signedIn) {
      setTokenGetter(() => getToken.value());
      connectSocket();
      try {
        authStore.setMe(await fetchMe());
      } catch {
        // server may be offline; dashboard will surface the error
      }
      if (route.meta.public) router.replace("/dashboard");
    } else {
      authStore.reset();
      disconnectSocket();
      if (route.meta.requiresAuth) router.replace("/login");
    }
  },
  { immediate: true },
);
</script>

<template>
  <div
    v-if="!isLoaded"
    class="flex h-[100dvh] items-center justify-center text-muted-foreground"
  >
    Lädt ...
  </div>
  <RouterView v-else v-slot="{ Component }">
    <Transition name="view" mode="out-in">
      <component :is="Component" />
    </Transition>
  </RouterView>
</template>
